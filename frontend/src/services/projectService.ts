import api from './api';

export interface Project {
  _id: string;
  name: string;
  files: Array<{ name: string; content: string; language: string }>;
  createdAt: string;
  updatedAt: string;
}

const projectService = {
  async createProject(projectData: {
    name: string;
    description?: string;
    language?: string;
    files: Array<{ name: string; content: string; language: string }>;
  }): Promise<Project> {
    const res = await api.post('/projects', projectData);
    return res.data;
  },
  
  // Eski versiyon için backward compatibility
  async createProjectSimple(name: string, files: Array<{ name: string; content: string; language: string }>): Promise<Project> {
    const res = await api.post('/projects', { name, files });
    return res.data;
  },
  
  async getProjects(): Promise<Project[]> {
    const res = await api.get('/projects');
    return res.data;
  },
  async getProject(id: string): Promise<Project> {
    const res = await api.get(`/projects/${id}`);
    return res.data;
  },
  async updateProject(id: string, update: Partial<Project>): Promise<Project> {
    const res = await api.put(`/projects/${id}`, update);
    return res.data;
  },
  async deleteProject(id: string): Promise<void> {
    await api.delete(`/projects/${id}`);
  },
  async downloadZip(id: string): Promise<Blob> {
    const res = await api.get(`/projects/${id}/download`, { responseType: 'blob' });
    return res.data;
  }
};

export default projectService; 