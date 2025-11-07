import { httpClient } from "@/shared/api/http-client";

import type {
  StartStudySessionRequest,
  StudyAnswerResponse,
  StudySessionDto,
  SubmitStudyAnswerRequest,
} from "../types";

const mapStartPayload = (payload: StartStudySessionRequest) => ({
  WordSetId: payload.WordSetId,
  Mode: payload.Mode,
  Direction: payload.Direction,
  Limit: payload.Limit ?? null,
  IncludeDue: payload.IncludeDue ?? true,
  IncludeNew: payload.IncludeNew ?? true,
  Shuffle: payload.Shuffle ?? true,
  AllowFlip: payload.AllowFlip ?? true,
  AllowTyping: payload.AllowTyping ?? true,
});

const mapAnswerPayload = (payload: SubmitStudyAnswerRequest) => ({
  ProgressId: payload.ProgressId,
  Rating: payload.Rating,
  TimeSpentSeconds: payload.TimeSpentSeconds,
  UserAnswer: payload.UserAnswer ?? null,
  SelectedOptions: payload.SelectedOptions ?? null,
});

export const studyApi = {
  startSession: async (
    payload: StartStudySessionRequest
  ): Promise<StudySessionDto> => {
    const response = await httpClient.post("/study/sessions", mapStartPayload(payload));
    return response.data as StudySessionDto;
  },

  getSession: async (sessionId: string): Promise<StudySessionDto> => {
    const response = await httpClient.get(`/study/sessions/${sessionId}`);
    return response.data as StudySessionDto;
  },

  submitAnswer: async (
    sessionId: string,
    payload: SubmitStudyAnswerRequest
  ): Promise<StudyAnswerResponse> => {
    const response = await httpClient.post(
      `/study/sessions/${sessionId}/answer`,
      mapAnswerPayload(payload)
    );
    return response.data as StudyAnswerResponse;
  },
};
