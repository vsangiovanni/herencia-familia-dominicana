export type LegacyAiMode = 'narrator' | 'hint' | 'mission' | 'dialogue' | 'convergence';

export type LegacyCharacter = {
  id: string;
  name: string;
  title: string;
  level: number;
  ability: string;
  color: string;
};

export type LegacyMission = {
  id: string;
  title: string;
  description: string;
  progress: number;
  goal: number;
};

export type LegacyWorldNode = {
  id: string;
  label: string;
  type: 'root' | 'branch' | 'document' | 'convergence' | 'locked';
  unlocked: boolean;
};

export type LegacyAiRequest = {
  mode: LegacyAiMode;
  player_id: string;
  scene_id: string;
  visible_node_ids: string[];
  collected_document_ids: string[];
  game_progress: Record<string, unknown>;
  user_prompt?: string;
};

export type LegacyAiResponse = {
  text: string;
  tone: 'epic' | 'intimate' | 'mystery' | 'warning';
  anchors: string[];
  suggested_action?: string;
  confidence: number;
};

export type LegacyGameEvent =
  | { type: 'document_collected'; documentId: string }
  | { type: 'hint_requested'; anchorId: string }
  | { type: 'convergence_unlocked'; convergenceId: string };

