import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import * as AdmZip from 'adm-zip';
import * as fs from 'fs-extra';
import * as path from 'path';
import axios from 'axios';
import { CodeAnalysis, CodeAnalysisDocument } from './schemas/code-analysis.schema';

interface FileInfo {
  name: string;
  path: string;
  content: string;
  language: string;
  size: number;
}

interface CodeIssue {
  type: 'error' | 'warning' | 'info';
  message: string;
  file: string;
  line?: number;
  suggestion?: string;
}

interface CodeSuggestion {
  category: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  codeExample?: string;
}

@Injectable()
export class CodeAnalysisService {
  private readonly logger = new Logger(CodeAnalysisService.name);
  private readonly apiKey: string;

  constructor(
    @InjectModel(CodeAnalysis.name) private codeAnalysisModel: Model<CodeAnalysisDocument>,
    private configService: ConfigService,
  ) {
    this.apiKey = this.configService.get<string>('GEMINI_API_KEY');
  }

  async analyzeZipFile(
    zipBuffer: Buffer,
    userId: string,
    projectName: string,
    originalFileName: string
  ): Promise<CodeAnalysis> {
    try {
      this.logger.log(`Starting analysis of ZIP file: ${originalFileName}`);

      // Extract ZIP file
      const extractedFiles = await this.extractZipFile(zipBuffer);
      
      // Analyze each file
      const analysis = await this.analyzeFiles(extractedFiles);
      
      // Get AI recommendations
      const aiRecommendations = await this.getAIRecommendations(extractedFiles, analysis);

      // Create analysis record
      const codeAnalysis = new this.codeAnalysisModel({
        userId,
        projectName,
        originalFileName,
        files: extractedFiles,
        analysis,
        aiRecommendations,
      });

      await codeAnalysis.save();
      this.logger.log(`Analysis completed for project: ${projectName}`);

      return codeAnalysis;
    } catch (error) {
      this.logger.error('Error analyzing ZIP file:', error);
      throw new BadRequestException('Failed to analyze ZIP file');
    }
  }

  private async extractZipFile(zipBuffer: Buffer): Promise<FileInfo[]> {
    const zip = new AdmZip(zipBuffer);
    const files: FileInfo[] = [];

    for (const entry of zip.getEntries()) {
      if (!entry.isDirectory) {
        const content = entry.getData().toString('utf8');
        const language = this.detectLanguage(entry.entryName);
        
        if (language) {
          files.push({
            name: path.basename(entry.entryName),
            path: entry.entryName,
            content,
            language,
            size: content.length,
          });
        }
      }
    }

    return files;
  }

  private detectLanguage(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    const languageMap: { [key: string]: string } = {
      '.cpp': 'cpp',
      '.cc': 'cpp',
      '.cxx': 'cpp',
      '.c': 'c',
      '.h': 'cpp',
      '.hpp': 'cpp',
      '.hxx': 'cpp',
      '.java': 'java',
      '.py': 'python',
      '.js': 'javascript',
      '.ts': 'typescript',
      '.html': 'html',
      '.css': 'css',
      '.php': 'php',
      '.rb': 'ruby',
      '.go': 'go',
      '.rs': 'rust',
      '.swift': 'swift',
      '.kt': 'kotlin',
      '.scala': 'scala',
    };

    return languageMap[ext] || 'unknown';
  }

  private async analyzeFiles(files: FileInfo[]): Promise<any> {
    const issues: CodeIssue[] = [];
    const suggestions: CodeSuggestion[] = [];
    let totalLines = 0;
    const languages = new Set<string>();

    for (const file of files) {
      languages.add(file.language);
      const lines = file.content.split('\n');
      totalLines += lines.length;

      // Analyze individual file
      const fileIssues = this.analyzeFile(file);
      issues.push(...fileIssues);

      // Generate suggestions for this file
      const fileSuggestions = this.generateSuggestions(file);
      suggestions.push(...fileSuggestions);
    }

    // Calculate metrics
    const metrics = this.calculateMetrics(files);

    return {
      totalFiles: files.length,
      totalLines,
      languages: Array.from(languages),
      complexity: this.calculateComplexity(files),
      issues,
      suggestions,
      metrics,
    };
  }

  private analyzeFile(file: FileInfo): CodeIssue[] {
    const issues: CodeIssue[] = [];
    const lines = file.content.split('\n');

    // Check for common issues
    lines.forEach((line, index) => {
      const lineNumber = index + 1;

      // Check for hardcoded values
      if (line.includes('localhost') || line.includes('127.0.0.1')) {
        issues.push({
          type: 'warning',
          message: 'Hardcoded localhost detected',
          file: file.name,
          line: lineNumber,
          suggestion: 'Use environment variables for configuration',
        });
      }

      // Check for TODO comments
      if (line.includes('TODO') || line.includes('FIXME')) {
        issues.push({
          type: 'info',
          message: 'TODO/FIXME comment found',
          file: file.name,
          line: lineNumber,
          suggestion: 'Consider addressing this TODO item',
        });
      }

      // Check for long lines
      if (line.length > 120) {
        issues.push({
          type: 'warning',
          message: 'Line too long',
          file: file.name,
          line: lineNumber,
          suggestion: 'Consider breaking long lines for better readability',
        });
      }

      // Check for magic numbers
      const magicNumberRegex = /\b\d{3,}\b/;
      if (magicNumberRegex.test(line) && !line.includes('//')) {
        issues.push({
          type: 'warning',
          message: 'Magic number detected',
          file: file.name,
          line: lineNumber,
          suggestion: 'Consider using named constants instead of magic numbers',
        });
      }
    });

    // Check for missing includes in C++
    if (file.language === 'cpp') {
      if (file.content.includes('cout') && !file.content.includes('#include <iostream>')) {
        issues.push({
          type: 'error',
          message: 'Missing iostream include',
          file: file.name,
          suggestion: 'Add #include <iostream> for cout usage',
        });
      }

      if (file.content.includes('string') && !file.content.includes('#include <string>')) {
        issues.push({
          type: 'error',
          message: 'Missing string include',
          file: file.name,
          suggestion: 'Add #include <string> for string usage',
        });
      }
    }

    return issues;
  }

  private generateSuggestions(file: FileInfo): CodeSuggestion[] {
    const suggestions: CodeSuggestion[] = [];

    // C++ specific suggestions
    if (file.language === 'cpp') {
      if (file.content.includes('new ') && !file.content.includes('delete')) {
        suggestions.push({
          category: 'Memory Management',
          title: 'Use Smart Pointers',
          description: 'Consider using smart pointers (unique_ptr, shared_ptr) instead of raw pointers',
          priority: 'high',
          codeExample: `// Instead of:
int* ptr = new int(42);

// Use:
std::unique_ptr<int> ptr = std::make_unique<int>(42);`,
        });
      }

      if (file.content.includes('using namespace std;')) {
        suggestions.push({
          category: 'Best Practices',
          title: 'Avoid using namespace std',
          description: 'Using namespace std can cause naming conflicts',
          priority: 'medium',
          codeExample: `// Instead of:
using namespace std;

// Use:
std::cout << "Hello" << std::endl;`,
        });
      }

      if (file.content.includes('printf') || file.content.includes('scanf')) {
        suggestions.push({
          category: 'Modern C++',
          title: 'Use C++ I/O',
          description: 'Consider using C++ streams instead of C-style I/O',
          priority: 'medium',
          codeExample: `// Instead of:
printf("Hello %s", name);

// Use:
std::cout << "Hello " << name << std::endl;`,
        });
      }
    }

    // General suggestions
    if (file.content.length > 1000) {
      suggestions.push({
        category: 'Code Organization',
        title: 'Consider splitting large file',
        description: 'This file is quite large. Consider breaking it into smaller, more focused files',
        priority: 'medium',
      });
    }

    if (!file.content.includes('//') && !file.content.includes('/*')) {
      suggestions.push({
        category: 'Documentation',
        title: 'Add comments',
        description: 'Consider adding comments to explain complex logic',
        priority: 'low',
      });
    }

    return suggestions;
  }

  private calculateMetrics(files: FileInfo[]): any {
    let totalComplexity = 0;
    let totalDuplication = 0;
    let documentedLines = 0;
    let totalLines = 0;

    files.forEach(file => {
      const lines = file.content.split('\n');
      totalLines += lines.length;

      // Count documented lines
      documentedLines += lines.filter(line => 
        line.trim().startsWith('//') || 
        line.trim().startsWith('/*') || 
        line.trim().startsWith('*')
      ).length;

      // Calculate cyclomatic complexity (simplified)
      const complexityKeywords = ['if', 'else', 'for', 'while', 'switch', 'case', 'catch', '&&', '||'];
      complexityKeywords.forEach(keyword => {
        const matches = (file.content.match(new RegExp(`\\b${keyword}\\b`, 'g')) || []).length;
        totalComplexity += matches;
      });

      // Calculate code duplication (simplified)
      const linesSet = new Set(lines.map(line => line.trim()).filter(line => line.length > 10));
      totalDuplication += lines.length - linesSet.size;
    });

    return {
      cyclomaticComplexity: totalComplexity,
      maintainabilityIndex: Math.max(0, 100 - totalComplexity),
      codeDuplication: totalDuplication,
      documentationCoverage: totalLines > 0 ? (documentedLines / totalLines) * 100 : 0,
    };
  }

  private calculateComplexity(files: FileInfo[]): number {
    let totalComplexity = 0;
    files.forEach(file => {
      const complexityKeywords = ['if', 'else', 'for', 'while', 'switch', 'case', 'catch', '&&', '||'];
      complexityKeywords.forEach(keyword => {
        const matches = (file.content.match(new RegExp(`\\b${keyword}\\b`, 'g')) || []).length;
        totalComplexity += matches;
      });
    });
    return totalComplexity;
  }

  private async getAIRecommendations(files: FileInfo[], analysis: any): Promise<string> {
    if (!this.apiKey) {
      return 'AI recommendations not available (API key not configured)';
    }

    try {
      const fileSummaries = files.map(file => 
        `${file.name} (${file.language}): ${file.content.length} characters`
      ).join('\n');

      const prompt = `Sen bir C/C++ kod analiz uzmanısın. Aşağıdaki proje dosyalarını analiz et ve öneriler ver:

**Proje Dosyaları:**
${fileSummaries}

**Analiz Sonuçları:**
- Toplam dosya: ${analysis.totalFiles}
- Toplam satır: ${analysis.totalLines}
- Diller: ${analysis.languages.join(', ')}
- Karmaşıklık: ${analysis.complexity}
- Sorunlar: ${analysis.issues.length} adet

**Tespit Edilen Sorunlar:**
${analysis.issues.map(issue => 
  `- ${issue.type.toUpperCase()}: ${issue.message} (${issue.file}${issue.line ? `:${issue.line}` : ''})`
).join('\n')}

**Öneriler:**
${analysis.suggestions.map(suggestion => 
  `- ${suggestion.priority.toUpperCase()}: ${suggestion.title} - ${suggestion.description}`
).join('\n')}

Lütfen bu proje için detaylı öneriler ver:
1. Genel kod kalitesi iyileştirmeleri
2. C/C++ best practices
3. Performance optimizasyonları
4. Güvenlik iyileştirmeleri
5. Kod organizasyonu önerileri

Yanıtını Türkçe ver ve pratik öneriler sun.`;

      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2000,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        return data.candidates[0].content.parts[0].text;
      } else {
        throw new Error('Invalid response format from Gemini API');
      }
    } catch (error) {
      this.logger.error('Error getting AI recommendations:', error);
      return 'AI önerileri alınamadı. Lütfen daha sonra tekrar deneyin.';
    }
  }

  async getUserAnalyses(userId: string): Promise<CodeAnalysis[]> {
    return this.codeAnalysisModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .exec();
  }

  async getAnalysisById(analysisId: string, userId: string): Promise<CodeAnalysis> {
    const analysis = await this.codeAnalysisModel.findOne({
      _id: analysisId,
      userId,
    }).exec();

    if (!analysis) {
      throw new BadRequestException('Analysis not found');
    }

    return analysis;
  }

  async deleteAnalysis(analysisId: string, userId: string): Promise<void> {
    const result = await this.codeAnalysisModel.deleteOne({
      _id: analysisId,
      userId,
    }).exec();

    if (result.deletedCount === 0) {
      throw new BadRequestException('Analysis not found');
    }
  }

  async compileAndRunCode(code: string, language: 'c' | 'cpp', stdin: string = ''): Promise<{
    success: boolean;
    output: string;
    error: string;
    executionTime: number;
    memoryUsage: number;
  }> {
    const languageId = language === 'c' ? 50 : 54; // Judge0: 50 = C, 54 = C++
    this.logger.log('[CodeAnalysis] Compile request:', { code, language, stdin });
    console.log('[CodeAnalysis] Compile request:', { code, language, stdin });
    
    // Input validasyonu
    const MAX_CODE_SIZE = 100 * 1024; // 100KB
    const MAX_STDIN_SIZE = 10 * 1024; // 10KB
    
    if (code.length > MAX_CODE_SIZE) {
      return {
        success: false,
        output: '',
        error: `Kod çok büyük. Maksimum ${MAX_CODE_SIZE / 1024}KB olmalı.`,
        executionTime: 0,
        memoryUsage: 0,
      };
    }
    
    if (stdin.length > MAX_STDIN_SIZE) {
      return {
        success: false,
        output: '',
        error: `Stdin çok büyük. Maksimum ${MAX_STDIN_SIZE / 1024}KB olmalı.`,
        executionTime: 0,
        memoryUsage: 0,
      };
    }
    
    try {
      // Kod ve stdin'i base64 encode et
      const base64Code = Buffer.from(code).toString('base64');
      const base64Stdin = Buffer.from(stdin).toString('base64');
      
      this.logger.log('[CodeAnalysis] Sending to Judge0:', {
        codeLength: code.length,
        stdinLength: stdin.length,
        base64CodeLength: base64Code.length,
        base64StdinLength: base64Stdin.length
      });
      
      const response = await axios.post(
        'http://localhost:2358/submissions?base64_encoded=true&wait=true',
        {
          source_code: base64Code,
          language_id: languageId,
          stdin: base64Stdin,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 30000, // 30 saniye timeout
        }
      );
      
      const data = response.data;
      this.logger.log('[CodeAnalysis] Judge0 raw response:', JSON.stringify(data, null, 2));
      console.log('[CodeAnalysis] Judge0 raw response:', JSON.stringify(data, null, 2));
      
      // Çıktıyı decode et
      const decode = (val: string) => val ? Buffer.from(val, 'base64').toString('utf-8') : '';
      
      // Judge0 status kodlarını kontrol et
      const statusId = data.status?.id;
      let errorMessage = '';
      
      if (statusId === 3) {
        // Başarılı
      } else if (statusId === 4) {
        errorMessage = 'Kod çalışma zamanında hata verdi: ' + decode(data.stderr);
      } else if (statusId === 5) {
        errorMessage = 'Kod çok uzun sürdü (timeout)';
      } else if (statusId === 6) {
        errorMessage = 'Kod derleme hatası: ' + decode(data.compile_output);
      } else if (statusId === 7) {
        errorMessage = 'Runtime error: ' + decode(data.stderr);
      } else if (statusId === 8) {
        errorMessage = 'Memory limit exceeded';
      } else if (statusId === 9) {
        errorMessage = 'Output limit exceeded';
      } else if (statusId === 10) {
        errorMessage = 'File size limit exceeded';
      } else {
        errorMessage = 'Bilinmeyen hata: ' + (data.status?.description || 'Unknown error');
      }
      
      return {
        success: statusId === 3,
        output: decode(data.stdout),
        error: errorMessage || decode(data.stderr) || decode(data.compile_output),
        executionTime: data.time || 0,
        memoryUsage: data.memory || 0,
      };
    } catch (error) {
      this.logger.error('[CodeAnalysis] Judge0 error:', error?.response?.data || error);
      console.error('[CodeAnalysis] Judge0 error:', error?.response?.data || error);
      
      let errorMessage = 'Online derleyiciye erişilemedi veya hata oluştu.';
      
      if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.code === 'ECONNREFUSED') {
        errorMessage = 'Judge0 servisi çalışmıyor. Lütfen Docker Compose ile başlatın.';
      } else if (error?.code === 'ETIMEDOUT') {
        errorMessage = 'Kod çalıştırma zaman aşımına uğradı.';
      }
      
      return {
        success: false,
        output: '',
        error: errorMessage,
        executionTime: 0,
        memoryUsage: 0,
      };
    }
  }

  async analyzeCodeWithAI(code: string, language: 'c' | 'cpp', question: string): Promise<string> {
    this.logger.log('[CodeAnalysis] AI analysis request:', { code, language, question });
    
    try {
      // AI servisini kullan
      // Geçici olarak basit bir AI analizi yap
      const analysis = `**Kod Analizi:**
Kodunuz ${language.toUpperCase()} dilinde yazılmış.

**Tespit Edilen Hatalar:**
${question}

**Düzeltmeler:**
Kodunuzu analiz etmek için AI servisi kullanılacak.

**Önerilen Kod:**
\`\`\`${language}
// AI analizi sonucu önerilen kod burada görünecek
\`\`\`

**Açıklama:**
AI analizi tamamlandığında detaylı sonuçlar burada görünecek.`;
      
      return analysis;
    } catch (error) {
      this.logger.error('[CodeAnalysis] AI analysis error:', error);
      throw new Error('AI analizi başarısız oldu: ' + error.message);
    }
  }
} 