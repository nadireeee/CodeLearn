import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import projectService, { Project } from '../services/projectService';
import { useNavigation } from '@react-navigation/native';

const ProjectsScreen: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    fetchProjects();
  }, []);

  async function fetchProjects() {
    setLoading(true);
    try {
      console.log('[ProjectsScreen] Fetching projects...');
      const data = await projectService.getProjects();
      console.log('[ProjectsScreen] Projects fetched:', data);
      setProjects(data);
    } catch (e: any) {
      console.error('[ProjectsScreen] Error fetching projects:', e);
      Alert.alert('Hata', `Projeler yüklenemedi: ${e.message || 'Bilinmeyen hata'}`);
    } finally {
      setLoading(false);
    }
  }

  function openProject(project: Project) {
    // Burada proje detay ekranına veya editöre yönlendirebilirsin
    (navigation as any).navigate('AiCodeBuilderScreen', { projectId: project._id });
  }

  async function downloadZip(project: Project) {
    try {
      const blob = await projectService.downloadZip(project._id);
      // Web için: dosyayı indirmek
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.name}.zip`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      Alert.alert('Hata', 'ZIP indirilemedi.');
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#1e293b', padding: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 20 }}>Projelerim</Text>
        <TouchableOpacity 
          onPress={fetchProjects} 
          style={{ backgroundColor: '#059669', padding: 8, borderRadius: 6 }}
          disabled={loading}
        >
          <Text style={{ color: '#fff' }}>🔄 Yenile</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={{ color: '#cbd5e1', fontSize: 12, marginBottom: 16 }}>
        Toplam proje: {projects.length}
      </Text>
      
      {loading ? (
        <View style={{ alignItems: 'center', marginTop: 50 }}>
          <ActivityIndicator color="#fff" size="large" />
          <Text style={{ color: '#cbd5e1', marginTop: 16 }}>Projeler yükleniyor...</Text>
        </View>
      ) : projects.length === 0 ? (
        <View style={{ alignItems: 'center', marginTop: 50 }}>
          <Text style={{ color: '#cbd5e1', fontSize: 16, textAlign: 'center' }}>
            Henüz proje bulunamadı.{'\n'}AI Code Builder'dan yeni proje oluşturun.
          </Text>
        </View>
      ) : (
        <FlatList
          data={projects}
          keyExtractor={item => item._id}
          renderItem={({ item }) => (
            <View style={{ backgroundColor: '#334155', borderRadius: 8, padding: 16, marginBottom: 12 }}>
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{item.name}</Text>
              <Text style={{ color: '#cbd5e1', fontSize: 12, marginBottom: 8 }}>Dosya sayısı: {item.files.length}</Text>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity onPress={() => openProject(item)} style={{ backgroundColor: '#2563eb', padding: 8, borderRadius: 6, marginRight: 8 }}>
                  <Text style={{ color: '#fff' }}>Aç</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => downloadZip(item)} style={{ backgroundColor: '#0ea5e9', padding: 8, borderRadius: 6 }}>
                  <Text style={{ color: '#fff' }}>ZIP İndir</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
};

export default ProjectsScreen; 