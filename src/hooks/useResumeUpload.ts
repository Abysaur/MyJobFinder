"use client";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Resume } from "@/types";

export function useResumeUpload() {
  return useMutation<Resume, Error, File>({ mutationFn: (file) => api.uploadResume(file) });
}
