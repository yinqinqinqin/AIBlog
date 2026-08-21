export type InterviewResourceQuestion = {
  id: string;
  question: string;
  answer: string;
  quickAnswer: string;
  options: string[];
  tags: string[];
  followUps: string[];
  source: string;
};

export type InterviewResourceModule = {
  id: string;
  title: string;
  description: string;
  concepts: string[];
  learnPoints: string[];
  reviewQuestions: string[];
  practice: string[];
  questions: InterviewResourceQuestion[];
};

export type InterviewResourceBank = {
  key: string;
  eyebrow: string;
  title: string[];
  description: string;
  sourceLabel: string;
  answerLabel: string;
  modules: InterviewResourceModule[];
};
