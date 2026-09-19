// Check available languages in Judge0
export async function getAvailableLanguages() {
  try {
    const res = await fetch('http://localhost:2358/languages');
    if (res.ok) {
      const languages = await res.json();
      console.log('Available languages:', languages);
      
      // Log all C/C++ related languages
      const cppLanguages = languages.filter((lang: any) => 
        lang.name?.toLowerCase().includes('c++') || 
        lang.name?.toLowerCase().includes('cpp') ||
        lang.name?.toLowerCase().includes('c ') ||
        lang.id === 54 || lang.id === 76
      );
      console.log('C/C++ languages found:', cppLanguages);
      
      // Log all languages for debugging
      console.log('All available languages:', languages.map((l: any) => ({ id: l.id, name: l.name })));
      
      return languages;
    }
  } catch (error) {
    console.log('Failed to get languages:', error);
  }
  return [];
}

export async function submitCode({ 
  source_code, 
  language_id, 
  stdin = '' 
}: {
  source_code: string;
  language_id: number;
  stdin?: string;
}) {
  try {
    // Try RapidAPI first (more reliable)
    console.log('Submitting code to RapidAPI Judge0...');
    return await submitCodeToRapidAPI({ source_code, language_id, stdin });
  } catch (error) {
    console.log('RapidAPI failed, trying local Judge0...');
    try {
      return await submitCodeToLocalJudge0({ source_code, language_id, stdin });
    } catch (localError) {
      console.log('Both services failed:', localError);
      throw error;
    }
  }
}

async function submitCodeToLocalJudge0({ 
  source_code, 
  language_id, 
  stdin = '' 
}: {
  source_code: string;
  language_id: number;
  stdin?: string;
}) {
  try {
    console.log('Submitting code to local Judge0...');
    console.log('Source code:', source_code);
    console.log('Language ID:', language_id);
    
    // First check available languages
    const languages = await getAvailableLanguages();
    let cppLanguage = languages.find((lang: any) => 
      lang.name?.toLowerCase().includes('c++') || 
      lang.name?.toLowerCase().includes('cpp') ||
      lang.id === 54 || lang.id === 76
    );
    
    // If C++ not found, try C
    if (!cppLanguage) {
      cppLanguage = languages.find((lang: any) => 
        lang.name?.toLowerCase().includes('c ') || 
        lang.id === 50
      );
      console.log('C++ not found, trying C:', cppLanguage);
    }
    
    if (cppLanguage) {
      console.log('Found language:', cppLanguage);
      language_id = cppLanguage.id;
    } else {
      console.log('No C/C++ language found, using default ID:', language_id);
      console.log('Available languages:', languages.map((l: any) => ({ id: l.id, name: l.name })));
    }
    
    // Add better error handling and retry logic
    const res = await fetch('http://localhost:2358/submissions?base64_encoded=false&wait=true', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ 
        source_code, 
        language_id, 
        stdin,
        cpu_time_limit: 5,
        memory_limit: 128000
      }),
    });
    
    if (res.ok) {
      const result = await res.json();
      console.log('Judge0 full response:', JSON.stringify(result, null, 2));
      
      // Better error handling for compilation errors
      if (result.status?.id === 6) {
        console.log('Compilation error detected, fetching compile output...');
        try {
          const compileRes = await fetch(`http://localhost:2358/submissions/${result.token}?base64_encoded=false`);
          if (compileRes.ok) {
            const compileResult = await compileRes.json();
            console.log('Compile output from separate request:', compileResult.compile_output);
            result.compile_output = compileResult.compile_output;
          }
        } catch (compileError) {
          console.log('Failed to fetch compile output:', compileError);
        }
        
        // Return a more informative error
        return {
          ...result,
          error: result.compile_output || 'Compilation failed. Please check your code syntax.',
          success: false
        };
      }
      
      return result;
    } else {
      console.log(`Judge0 failed with status: ${res.status}, trying RapidAPI...`);
      return await submitCodeToRapidAPI({ source_code, language_id, stdin });
    }
  } catch (error) {
    console.log('Local Judge0 error:', error);
    console.log('Trying RapidAPI as fallback...');
    return await submitCodeToRapidAPI({ source_code, language_id, stdin });
  }
}

// Fallback to RapidAPI Judge0
async function submitCodeToRapidAPI({ 
  source_code, 
  language_id, 
  stdin = '' 
}: {
  source_code: string;
  language_id: number;
  stdin?: string;
}) {
  try {
    console.log('Submitting code to RapidAPI Judge0...');
    
    // Map language IDs for RapidAPI
    const rapidApiLanguageId = language_id === 54 || language_id === 76 ? 54 : language_id;
    
    const res = await fetch('https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-RapidAPI-Key': '3a908ea03fmsh9eb49d83cb1303ap117331jsn6901dff5643b', // Replace with your actual key
        'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
      },
      body: JSON.stringify({
        source_code,
        language_id: rapidApiLanguageId,
        stdin,
        cpu_time_limit: 5,
        memory_limit: 128000
      }),
    });
    
    if (res.ok) {
      const result = await res.json();
      console.log('RapidAPI Judge0 response:', result);
      return result;
    } else {
      console.log('RapidAPI Judge0 failed:', res.status);
      throw new Error(`RapidAPI HTTP ${res.status}: ${res.statusText}`);
    }
  } catch (error) {
    console.log('RapidAPI Judge0 error:', error);
    throw error;
  }
}

// Test Judge0 with a simple Python code
export async function testJudge0() {
  try {
    console.log('Testing Judge0 with Python...');
    const testCode = 'print("Hello from Judge0!")';
    
    const res = await fetch('http://localhost:2358/submissions?base64_encoded=false&wait=true', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ 
        source_code: testCode, 
        language_id: 71, // Python
        stdin: '',
        cpu_time_limit: 5,
        memory_limit: 128000
      }),
    });
    
    if (res.ok) {
      const result = await res.json();
      console.log('Judge0 test result:', result);
      return result;
    } else {
      console.log('Judge0 test failed:', res.status);
      return null;
    }
  } catch (error) {
    console.log('Judge0 test error:', error);
    return null;
  }
}

// Multi-file submission support
export async function submitMultiFileProject({ 
  files, 
  mainFile = 'main.cpp',
  stdin = '',
  compilerOptions = ''
}: {
  files: Record<string, string>;
  mainFile?: string;
  stdin?: string;
  compilerOptions?: string;
}) {
  try {
    console.log('Submitting multi-file project to Judge0...');
    console.log('Files:', Object.keys(files));
    console.log('Main file:', mainFile);
    
    // Create ZIP content with all files
    const zipContent = await createZipFromFiles(files, mainFile, compilerOptions);
    
    // Submit as multi-file program (language_id: 89)
    const res = await fetch('http://localhost:2358/submissions?base64_encoded=true&wait=true', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ 
        language_id: 89, // Multi-file program
        additional_files: zipContent,
        stdin,
        cpu_time_limit: 10,
        memory_limit: 256000
      }),
    });
    
    if (res.ok) {
      const result = await res.json();
      console.log('Multi-file submission result:', JSON.stringify(result, null, 2));
      return result;
    } else {
      console.log('Multi-file submission failed:', res.status);
      const errorText = await res.text();
      console.log('Error details:', errorText);
      throw new Error(`HTTP ${res.status}: ${errorText}`);
    }
  } catch (error) {
    console.log('Multi-file submission error:', error);
    throw error;
  }
}

// Helper function to create ZIP file from multiple files
async function createZipFromFiles(
  files: Record<string, string>, 
  mainFile: string, 
  compilerOptions: string = ''
): Promise<string> {
  console.log('📦 Basit ZIP olusturuluyor...');
  
  // Compile script'i oluştur
  const compileScript = createCompileScript(Object.keys(files), mainFile, compilerOptions);
  
  // Tüm dosyaları birleştir
  const allFiles = {
    ...files,
    'compile.sh': compileScript
  };

  console.log('📦 ZIP icerigi:', Object.keys(allFiles));

  // Basit format
  let content = '';
  
  for (const [filename, fileContent] of Object.entries(allFiles)) {
    // Türkçe karakterleri temizle
    const cleanContent = fileContent.replace(/[^\x00-\x7F]/g, (char) => {
      const turkishMap: Record<string, string> = {
        'ç': 'c', 'Ç': 'C',
        'ğ': 'g', 'Ğ': 'G',
        'ı': 'i', 'I': 'I',
        'ö': 'o', 'Ö': 'O',
        'ş': 's', 'Ş': 'S',
        'ü': 'u', 'Ü': 'U'
      };
      return turkishMap[char] || '?';
    });
    
    content += `--- ${filename} ---\n`;
    content += cleanContent;
    content += '\n--- END ---\n\n';
  }
  
  // UTF-8 güvenli Base64'e çevir
  const base64Content = safeBase64Encode(content);
  console.log('📦 ZIP boyutu:', base64Content.length, 'karakter');
  
  return base64Content;
}

function createCompileScript(filenames: string[], mainFile: string, compilerOptions: string = ''): string {
  const cppFiles = filenames.filter(f => f.endsWith('.cpp') || f.endsWith('.cc') || f.endsWith('.cxx'));
  const cFiles = filenames.filter(f => f.endsWith('.c'));
  const headerFiles = filenames.filter(f => f.endsWith('.h') || f.endsWith('.hpp'));
  
  let compileCommand = '';
  let compiler = '';
  
  if (cppFiles.length > 0) {
    compiler = 'g++';
    compileCommand = `${compiler} ${compilerOptions} ${cppFiles.join(' ')} -o program`;
  } else if (cFiles.length > 0) {
    compiler = 'gcc';
    compileCommand = `${compiler} ${compilerOptions} ${cFiles.join(' ')} -o program`;
  } else {
    compiler = mainFile.endsWith('.cpp') ? 'g++' : 'gcc';
    compileCommand = `${compiler} ${compilerOptions} ${mainFile} -o program`;
  }
  
  return `#!/bin/bash
set -e
echo "Derleme basliyor..."
echo "Compiler: ${compiler}"
echo "Komut: ${compileCommand}"
echo "Dosyalar: $(ls -la)"

# Header dosyalarini kontrol et
${headerFiles.length > 0 ? `echo "Header dosyalari: ${headerFiles.join(' ')}"` : ''}

# Derleme
${compileCommand}

echo "Derleme basarili!"
echo "Cikti dosyasi: $(ls -la program)"
`;
}

// Submit project with header files (single main file + additional files)
export async function submitProjectWithHeaders({ 
  mainCode, 
  additionalFiles, 
  language_id = 54, // C++ by default
  stdin = '',
  compilerOptions = ''
}: {
  mainCode: string;
  additionalFiles: Record<string, string>;
  language_id?: number;
  stdin?: string;
  compilerOptions?: string;
}) {
  try {
    console.log('Submitting project with headers...');
    
    // Create additional files content
    let additionalFilesContent = '';
    for (const [filename, content] of Object.entries(additionalFiles)) {
      additionalFilesContent += `===FILE:${filename}===\n${content}\n===ENDFILE===\n`;
    }
    
    const additionalFilesBase64 = btoa(additionalFilesContent);
    
    const res = await fetch('http://localhost:2358/submissions?base64_encoded=true&wait=true', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ 
        source_code: btoa(mainCode),
        language_id,
        additional_files: additionalFilesBase64,
        compiler_options: compilerOptions,
        stdin: btoa(stdin),
        cpu_time_limit: 10,
        memory_limit: 256000
      }),
    });
    
    if (res.ok) {
      const result = await res.json();
      console.log('Project with headers result:', JSON.stringify(result, null, 2));
      return result;
    } else {
      console.log('Project with headers failed:', res.status);
      const errorText = await res.text();
      console.log('Error details:', errorText);
      throw new Error(`HTTP ${res.status}: ${errorText}`);
    }
  } catch (error) {
    console.log('Project with headers error:', error);
    throw error;
  }
}

// Check if multi-file support is available
export async function checkMultiFileSupport(): Promise<boolean> {
  try {
    const languages = await getAvailableLanguages();
    const multiFileLanguage = languages.find((lang: any) => 
      lang.id === 89 || lang.name?.toLowerCase().includes('multi-file')
    );
    
    console.log('Multi-file language support:', multiFileLanguage);
    return !!multiFileLanguage;
  } catch (error) {
    console.log('Failed to check multi-file support:', error);
    return false;
  }
}

// ✅ GELİŞTİRİLMİŞ: NESNE YÖNELİMLİ C++ DESTEĞI
export async function submitOOPProject({ 
  projectFiles, 
  mainFileName = 'main.cpp',
  stdin = '',
  compilerOptions = '-std=c++17 -O2 -Wall'
}: {
  projectFiles: Array<{ name: string; content: string; language: string }>;
  mainFileName?: string;
  stdin?: string;
  compilerOptions?: string;
}) {
  try {
    console.log('🎯 Nesne Yönelimli C++ projesi derleniyor...');
    console.log('📁 Dosyalar:', projectFiles.map(f => f.name));
    console.log('🎯 Ana dosya:', mainFileName);
    
    // Dosyaları kategorize et
    const cppFiles = projectFiles.filter(f => f.name.endsWith('.cpp') || f.name.endsWith('.cc'));
    const headerFiles = projectFiles.filter(f => f.name.endsWith('.h') || f.name.endsWith('.hpp'));
    const mainFile = projectFiles.find(f => f.name === mainFileName) || cppFiles[0];
    
    if (!mainFile) {
      throw new Error('Ana dosya bulunamadı!');
    }
    
    console.log('📊 OOP Analizi:', {
      cppFiles: cppFiles.length,
      headerFiles: headerFiles.length,
      mainFile: mainFile.name
    });
    
    // ✅ HEADER DOSYALARINI İNLINE OLARAK BİRLEŞTİR
    let combinedCode = '';
    
    // 1. Önce tüm header dosyalarını ekle
    if (headerFiles.length > 0) {
      console.log('📝 Header dosyaları ekleniyor...');
      
      // Header guard'ları kaldır ve içerikleri birleştir
      const processedHeaders = new Set<string>();
      
      for (const header of headerFiles) {
        if (!processedHeaders.has(header.name)) {
          console.log(`📄 ${header.name} işleniyor...`);
          
          let headerContent = header.content;
          
          // Header guard'ları temizle
          headerContent = headerContent
            .replace(/#ifndef\s+\w+\s*\n/g, '')
            .replace(/#define\s+\w+\s*\n/g, '')
            .replace(/#endif.*$/gm, '')
            .replace(/#pragma\s+once\s*\n/g, '')
            .trim();
          
          // Diğer header include'larını kaldır (çünkü hepsini inline ekliyoruz)
          headerContent = headerContent.replace(/#include\s*["<][^">]+[">]\s*\n/g, '');
          
          combinedCode += `\n// ===== ${header.name} START =====\n`;
          combinedCode += headerContent;
          combinedCode += `\n// ===== ${header.name} END =====\n\n`;
          
          processedHeaders.add(header.name);
        }
      }
    }
    
    // 2. Diğer .cpp dosyalarını ekle (main hariç)
    const otherCppFiles = cppFiles.filter(f => f.name !== mainFile.name);
    if (otherCppFiles.length > 0) {
      console.log('📝 Diğer C++ dosyaları ekleniyor...');
      
      for (const cppFile of otherCppFiles) {
        console.log(`📄 ${cppFile.name} işleniyor...`);
        
        let cppContent = cppFile.content;
        
        // Header include'larını kaldır (çünkü zaten inline ekledik)
        cppContent = cppContent.replace(/#include\s*["<][^">]+[">]\s*\n/g, '');
        
        // Main fonksiyonu varsa kaldır
        cppContent = cppContent.replace(/int\s+main\s*\([^)]*\)\s*\{[^}]*\}/g, '');
        
        combinedCode += `\n// ===== ${cppFile.name} START =====\n`;
        combinedCode += cppContent;
        combinedCode += `\n// ===== ${cppFile.name} END =====\n\n`;
      }
    }
    
    // 3. Ana dosyayı ekle
    console.log('📝 Ana dosya ekleniyor...');
    let mainContent = mainFile.content;
    
    // Ana dosyadan header include'larını kaldır
    mainContent = mainContent.replace(/#include\s*["<][^">]+[">]\s*\n/g, (match) => {
      // Sadece kendi header'larımızı kaldır, sistem header'ları bırak
      if (match.includes('"')) {
        return ''; // Kendi header'larımız
      }
      return match; // Sistem header'ları (<iostream>, <string> vs.)
    });
    
    combinedCode += `\n// ===== ${mainFile.name} START =====\n`;
    combinedCode += mainContent;
    combinedCode += `\n// ===== ${mainFile.name} END =====\n`;
    
    console.log('📄 Birleştirilmiş kod boyutu:', combinedCode.length, 'karakter');
    console.log('📄 Birleştirilmiş kod (ilk 300 karakter):', combinedCode.substring(0, 300));
    
    // 4. Judge0'a gönder
    const language_id = 54; // C++
    
    const result = await submitCode({
      source_code: combinedCode,
      language_id,
      stdin
    });
    
    console.log('✅ OOP Derleme sonucu:', result);
    return result;
    
  } catch (error) {
    console.error('❌ OOP Derleme hatası:', error);
    throw error;
  }
}

// ✅ AKILLI HEADER İŞLEME
function smartProcessHeaders(headerFiles: Array<{ name: string; content: string }>): string {
  console.log('🧠 Akıllı header işleme başlıyor...');
  
  const processedHeaders = new Map<string, string>();
  const dependencies = new Map<string, string[]>();
  
  // Header bağımlılıklarını analiz et
  for (const header of headerFiles) {
    const deps: string[] = [];
    const includeMatches = header.content.match(/#include\s*["<]([^">]+)[">]/g);
    
    if (includeMatches) {
      for (const match of includeMatches) {
        const headerName = match.match(/#include\s*["<]([^">]+)[">]/)?.[1];
        if (headerName && headerName.endsWith('.h') || headerName.endsWith('.hpp')) {
          deps.push(headerName);
        }
      }
    }
    
    dependencies.set(header.name, deps);
    console.log(`📄 ${header.name} bağımlılıkları:`, deps);
  }
  
  // Topological sort ile doğru sıralamayı bul
  const sorted = topologicalSort(headerFiles.map(h => h.name), dependencies);
  console.log('📋 Header sıralaması:', sorted);
  
  // Sıralı şekilde header'ları işle
  let combinedHeaders = '';
  for (const headerName of sorted) {
    const header = headerFiles.find(h => h.name === headerName);
    if (header && !processedHeaders.has(headerName)) {
      let content = header.content
        .replace(/#ifndef\s+\w+\s*\n/g, '')
        .replace(/#define\s+\w+\s*\n/g, '')
        .replace(/#endif.*$/gm, '')
        .replace(/#pragma\s+once\s*\n/g, '')
        .replace(/#include\s*["<][^">]+[">]\s*\n/g, '') // Tüm include'ları kaldır
        .trim();
      
      combinedHeaders += `\n// ===== ${headerName} =====\n${content}\n`;
      processedHeaders.set(headerName, content);
    }
  }
  
  return combinedHeaders;
}

// Topological sort implementation
function topologicalSort(nodes: string[], dependencies: Map<string, string[]>): string[] {
  const visited = new Set<string>();
  const visiting = new Set<string>();
  const result: string[] = [];
  
  function visit(node: string) {
    if (visiting.has(node)) {
      // Circular dependency, ignore
      return;
    }
    if (visited.has(node)) {
      return;
    }
    
    visiting.add(node);
    const deps = dependencies.get(node) || [];
    
    for (const dep of deps) {
      if (nodes.includes(dep)) {
        visit(dep);
      }
    }
    
    visiting.delete(node);
    visited.add(node);
    result.push(node);
  }
  
  for (const node of nodes) {
    visit(node);
  }
  
  return result;
}

// ✅ submitProjectFromMongoDB'yi güncelle
export async function submitProjectFromMongoDB({ 
  projectFiles, 
  mainFileName = 'main.cpp',
  stdin = '',
  compilerOptions = '-std=c++17 -O2'
}: {
  projectFiles: Array<{ name: string; content: string; language: string }>;
  mainFileName?: string;
  stdin?: string;
  compilerOptions?: string;
}) {
  try {
    console.log('🚀 MongoDB projesini Judge0\'a gönderiliyor...');
    
    // Dosyaları analiz et
    const cppFiles = projectFiles.filter(f => f.name.endsWith('.cpp') || f.name.endsWith('.cc'));
    const headerFiles = projectFiles.filter(f => f.name.endsWith('.h') || f.name.endsWith('.hpp'));
    
    // Eğer header dosyaları varsa veya birden fazla cpp dosyası varsa OOP modu kullan
    if (headerFiles.length > 0 || cppFiles.length > 1) {
      console.log('🎯 OOP modu kullanılıyor...');
      return await submitOOPProject({
        projectFiles,
        mainFileName,
        stdin,
        compilerOptions
      });
    } else {
      // Basit tek dosya modu
      console.log('📝 Basit tek dosya modu...');
      const mainFile = projectFiles.find(f => f.name === mainFileName) || cppFiles[0];
      
      if (!mainFile) {
        throw new Error('Ana dosya bulunamadı!');
      }
      
      return await submitCode({
        source_code: mainFile.content,
        language_id: mainFile.name.endsWith('.cpp') ? 54 : 50,
        stdin
      });
    }
    
  } catch (error) {
    console.error('❌ MongoDB proje gönderimi hatası:', error);
    throw error;
  }
}

// UTF-8 güvenli base64 encoding
function safeBase64Encode(str: string): string {
  try {
    // UTF-8 karakterleri için güvenli encoding
    const utf8Bytes = new TextEncoder().encode(str);
    const base64 = btoa(String.fromCharCode(...utf8Bytes));
    return base64;
  } catch (error) {
    console.error('Base64 encoding hatası:', error);
    // Fallback: Türkçe karakterleri temizle
    const cleanStr = str.replace(/[^\x00-\x7F]/g, '?');
    return btoa(cleanStr);
  }
} 