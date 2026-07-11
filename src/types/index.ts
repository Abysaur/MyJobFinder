export type Resume = {
  skills: string[];
  jobTitles: string[];
  yearsExperience: number;
  education: string[];
  location: string | null;
  contact: { name?: string; email?: string; phone?: string };
};

export type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  remote: boolean;
  salary?: string;
  url: string;
  description: string;
  postedDate: string; // ISO
  tags: string[];
};

export type MatchResult = {
  jobId: string;
  score: number; // 0-100 integer
  missingSkills: string[];
  reason: string;
};
