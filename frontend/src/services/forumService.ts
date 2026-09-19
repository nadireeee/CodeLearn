import api from './api';

export interface Question {
  id: string;
  title: string;
  content: string;
  status: 'open' | 'closed' | 'duplicate' | 'off_topic';
  viewCount: number;
  answerCount: number;
  voteCount: number;
  isAnswered: boolean;
  category: 'C' | 'C++';
  author: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
  tags: Array<{
    id: string;
    name: string;
  }>;
  answers?: Answer[];
  comments?: Comment[];
  createdAt: string;
  updatedAt: string;
}

export interface Answer {
  id: string;
  content: string;
  isAccepted: boolean;
  voteCount: number;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
  comments?: Comment[];
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  content: string;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
  createdAt: string;
}

export interface CreateQuestionDto {
  title: string;
  content: string;
  category: 'C' | 'C++';
  tags?: string[];
}

export interface CreateAnswerDto {
  content: string;
}

export interface CreateCommentDto {
  content: string;
  answerId?: string;
}

export interface VoteDto {
  type: 1 | -1; // 1: upvote, -1: downvote
}

export interface GetQuestionsQuery {
  search?: string;
  category?: string;
  tags?: string;
  sortBy?: 'newest' | 'oldest' | 'most_voted' | 'most_viewed' | 'most_answered';
  limit?: number;
  page?: number;
}

class ForumService {
  // Questions
  async getQuestions(query: GetQuestionsQuery = {}) {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });
    
    const response = await api.get(`/forum/questions?${params.toString()}`);
    return response.data;
  }

  async getQuestionById(id: string) {
    const response = await api.get(`/forum/questions/${id}`);
    return response.data;
  }

  async createQuestion(data: CreateQuestionDto) {
    const response = await api.post('/forum/questions', data);
    return response.data;
  }

  async updateQuestion(id: string, data: Partial<CreateQuestionDto>) {
    const response = await api.put(`/forum/questions/${id}`, data);
    return response.data;
  }

  async deleteQuestion(id: string) {
    await api.delete(`/forum/questions/${id}`);
  }

  // Answers
  async createAnswer(questionId: string, data: CreateAnswerDto) {
    const response = await api.post(`/forum/questions/${questionId}/answers`, data);
    return response.data;
  }

  async updateAnswer(id: string, data: Partial<CreateAnswerDto>) {
    const response = await api.put(`/forum/answers/${id}`, data);
    return response.data;
  }

  async deleteAnswer(id: string) {
    await api.delete(`/forum/answers/${id}`);
  }

  // Comments
  async createQuestionComment(questionId: string, data: CreateCommentDto) {
    const response = await api.post(`/forum/questions/${questionId}/comments`, data);
    return response.data;
  }

  async createAnswerComment(answerId: string, data: CreateCommentDto) {
    const response = await api.post(`/forum/answers/${answerId}/comments`, data);
    return response.data;
  }

  // Votes
  async voteQuestion(questionId: string, data: VoteDto) {
    await api.post(`/forum/questions/${questionId}/vote`, data);
  }

  async voteAnswer(answerId: string, data: VoteDto) {
    await api.post(`/forum/answers/${answerId}/vote`, data);
  }

  async getQuestionVotes(questionId: string) {
    const response = await api.get(`/forum/questions/${questionId}/votes`);
    return response.data;
  }

  async getQuestionVoteStatus(questionId: string) {
    const response = await api.get(`/forum/questions/${questionId}/vote-status`);
    return response.data;
  }

  async getAnswerVotes(answerId: string) {
    const response = await api.get(`/forum/answers/${answerId}/votes`);
    return response.data;
  }

  async getAnswerVoteStatus(answerId: string) {
    const response = await api.get(`/forum/answers/${answerId}/vote-status`);
    return response.data;
  }

  // Tags
  async getTags() {
    const response = await api.get('/forum/tags');
    return response.data;
  }
}

export default new ForumService(); 