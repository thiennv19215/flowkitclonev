/**
 * FlowKit Backend API Types
 * Mirrors agent/models/*.py Pydantic schemas.
 * Backend: http://127.0.0.1:8100
 */

export type UUID = string;
export type ISODateString = string;

// ============ ENUMS ============

export type RequestType =
  | "GENERATE_IMAGE"
  | "REGENERATE_IMAGE"
  | "EDIT_IMAGE"
  | "GENERATE_VIDEO"
  | "REGENERATE_VIDEO"
  | "GENERATE_VIDEO_REFS"
  | "UPSCALE_VIDEO"
  | "GENERATE_CHARACTER_IMAGE"
  | "REGENERATE_CHARACTER_IMAGE"
  | "EDIT_CHARACTER_IMAGE";

export type Orientation = "VERTICAL" | "HORIZONTAL";
export type StatusType = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
export type ChainType = "ROOT" | "CONTINUATION" | "INSERT";
export type SceneSource = "root" | "user" | "system";
export type ProjectStatus = "ACTIVE" | "ARCHIVED" | "DELETED";
export type VideoStatus = "DRAFT" | "PROCESSING" | "COMPLETED" | "FAILED";
export type PaygateTier = "PAYGATE_TIER_ONE" | "PAYGATE_TIER_TWO";
export type EntityType =
  | "character"
  | "location"
  | "creature"
  | "visual_asset"
  | "generic_troop"
  | "faction";

export type ImageAspectRatio =
  | "IMAGE_ASPECT_RATIO_PORTRAIT"
  | "IMAGE_ASPECT_RATIO_LANDSCAPE"
  | "IMAGE_ASPECT_RATIO_SQUARE";

export type VideoAspectRatio =
  | "VIDEO_ASPECT_RATIO_PORTRAIT"
  | "VIDEO_ASPECT_RATIO_LANDSCAPE";

export type VideoResolution = "VIDEO_RESOLUTION_4K" | "VIDEO_RESOLUTION_1080P";

// ============ PROJECT ============

export interface CharacterInput {
  name: string;
  entity_type?: EntityType;
  description?: string | null;
  voice_description?: string | null;
}

export interface ProjectCreate {
  name: string;
  description?: string | null;
  story?: string | null;
  language?: string;
  user_paygate_tier?: PaygateTier;
  tool_name?: string;
  material?: string;
  style?: string | null; // deprecated, use material
  allow_music?: boolean;
  allow_voice?: boolean;
  characters?: CharacterInput[] | null;
}

export interface ProjectUpdate {
  name?: string;
  description?: string | null;
  story?: string | null;
  thumbnail_url?: string | null;
  language?: string;
  status?: ProjectStatus;
  user_paygate_tier?: PaygateTier;
  narrator_voice?: string | null;
  narrator_ref_audio?: string | null;
  material?: string;
  allow_music?: boolean;
  allow_voice?: boolean;
}

export interface Project {
  id: UUID;
  name: string;
  description?: string | null;
  story?: string | null;
  thumbnail_url?: string | null;
  language: string;
  status: string;
  user_paygate_tier: string;
  material?: string | null;
  allow_music: boolean;
  allow_voice: boolean;
  narrator_voice?: string | null;
  narrator_ref_audio?: string | null;
  created_at?: ISODateString | null;
  updated_at?: ISODateString | null;
}

// ============ CHARACTER (entity) ============

export interface CharacterCreate {
  name: string;
  entity_type?: EntityType;
  description?: string | null;
  image_prompt?: string | null;
  voice_description?: string | null;
  reference_image_url?: string | null;
  media_id?: UUID | null;
}

export interface CharacterUpdate {
  name?: string;
  entity_type?: EntityType;
  description?: string | null;
  image_prompt?: string | null;
  voice_description?: string | null;
  reference_image_url?: string | null;
  media_id?: UUID | null;
}

export interface Character {
  id: UUID;
  name: string;
  slug?: string | null;
  entity_type: EntityType;
  description?: string | null;
  image_prompt?: string | null;
  voice_description?: string | null;
  reference_image_url?: string | null;
  media_id?: UUID | null;
  created_at?: ISODateString | null;
  updated_at?: ISODateString | null;
}

// ============ VIDEO ============

export interface VideoCreate {
  project_id: UUID;
  title: string;
  description?: string | null;
  display_order?: number;
  orientation?: string | null;
}

export interface VideoUpdate {
  title?: string;
  description?: string | null;
  display_order?: number;
  status?: VideoStatus;
  orientation?: string | null;
  vertical_url?: string | null;
  horizontal_url?: string | null;
  thumbnail_url?: string | null;
  duration?: number | null;
  resolution?: string | null;
  youtube_id?: string | null;
  privacy?: string | null;
  tags?: string | null;
}

export interface Video {
  id: UUID;
  project_id: UUID;
  title: string;
  description?: string | null;
  display_order: number;
  status: string;
  orientation?: string | null;
  vertical_url?: string | null;
  horizontal_url?: string | null;
  thumbnail_url?: string | null;
  duration?: number | null;
  resolution?: string | null;
  youtube_id?: string | null;
  privacy: string;
  tags?: string | null;
  created_at?: ISODateString | null;
  updated_at?: ISODateString | null;
}

// ============ SCENE ============

export interface SceneCreate {
  video_id: UUID;
  display_order?: number;
  prompt: string;
  image_prompt?: string | null;
  video_prompt?: string | null;
  transition_prompt?: string | null;
  character_names?: string[] | null;
  parent_scene_id?: UUID | null;
  chain_type?: ChainType;
  source?: SceneSource | null;
}

export interface SceneUpdate {
  prompt?: string;
  image_prompt?: string | null;
  video_prompt?: string | null;
  character_names?: string[] | null;
  parent_scene_id?: UUID | null;
  chain_type?: ChainType;
  source?: SceneSource;
  display_order?: number;

  vertical_image_url?: string | null;
  vertical_image_media_id?: UUID | null;
  vertical_image_status?: StatusType;
  vertical_video_url?: string | null;
  vertical_video_media_id?: UUID | null;
  vertical_video_status?: StatusType;
  vertical_upscale_url?: string | null;
  vertical_upscale_media_id?: UUID | null;
  vertical_upscale_status?: StatusType;

  horizontal_image_url?: string | null;
  horizontal_image_media_id?: UUID | null;
  horizontal_image_status?: StatusType;
  horizontal_video_url?: string | null;
  horizontal_video_media_id?: UUID | null;
  horizontal_video_status?: StatusType;
  horizontal_upscale_url?: string | null;
  horizontal_upscale_media_id?: UUID | null;
  horizontal_upscale_status?: StatusType;

  vertical_end_scene_media_id?: UUID | null;
  horizontal_end_scene_media_id?: UUID | null;

  transition_prompt?: string | null;
  trim_start?: number | null;
  trim_end?: number | null;
  duration?: number | null;
  narrator_text?: string | null;
}

export interface Scene {
  id: UUID;
  video_id: UUID;
  display_order: number;
  prompt?: string | null;
  image_prompt?: string | null;
  video_prompt?: string | null;
  character_names?: string[] | null;
  parent_scene_id?: UUID | null;
  chain_type: string;
  source?: string | null;

  vertical_image_url?: string | null;
  vertical_image_media_id?: UUID | null;
  vertical_image_status: string;
  vertical_video_url?: string | null;
  vertical_video_media_id?: UUID | null;
  vertical_video_status: string;
  vertical_upscale_url?: string | null;
  vertical_upscale_media_id?: UUID | null;
  vertical_upscale_status: string;

  horizontal_image_url?: string | null;
  horizontal_image_media_id?: UUID | null;
  horizontal_image_status: string;
  horizontal_video_url?: string | null;
  horizontal_video_media_id?: UUID | null;
  horizontal_video_status: string;
  horizontal_upscale_url?: string | null;
  horizontal_upscale_media_id?: UUID | null;
  horizontal_upscale_status: string;

  vertical_end_scene_media_id?: UUID | null;
  horizontal_end_scene_media_id?: UUID | null;

  transition_prompt?: string | null;
  trim_start?: number | null;
  trim_end?: number | null;
  duration?: number | null;
  narrator_text?: string | null;

  created_at?: ISODateString | null;
  updated_at?: ISODateString | null;
}

// ============ REQUEST (queue) ============

export interface RequestCreate {
  type: RequestType;
  orientation?: Orientation | null;
  scene_id?: UUID | null;
  character_id?: UUID | null;
  project_id?: UUID | null;
  video_id?: UUID | null;
  source_media_id?: UUID | null;
}

export interface BatchRequestCreate {
  requests: RequestCreate[];
}

export interface Request {
  id: UUID;
  project_id?: UUID | null;
  video_id?: UUID | null;
  scene_id?: UUID | null;
  character_id?: UUID | null;
  type: string;
  orientation?: string | null;
  status: string;
  request_id?: string | null;
  media_id?: UUID | null;
  output_url?: string | null;
  error_message?: string | null;
  retry_count: number;
  source_media_id?: UUID | null;
  created_at?: ISODateString | null;
  updated_at?: ISODateString | null;
}

export interface RequestUpdate {
  status?: StatusType;
  media_id?: UUID | null;
  output_url?: string | null;
  error_message?: string | null;
  request_id?: string | null;
}

export interface BatchStatus {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  done: boolean;
  all_succeeded: boolean;
  orientation?: string | null;
}

// ============ MATERIAL ============

export interface Material {
  id: string;
  name: string;
  style_instruction: string;
  negative_prompt?: string | null;
  scene_prefix?: string | null;
  lighting: string;
  is_builtin: boolean;
}

export interface MaterialCreateRequest {
  id: string;
  name: string;
  style_instruction: string;
  negative_prompt?: string | null;
  scene_prefix?: string | null;
  lighting?: string;
}

// ============ FLOW (direct API) ============

export interface FlowStatus {
  connected: boolean;
  flow_key_present: boolean;
}

export interface FlowCredits {
  userPaygateTier?: string;
  credits?: number;
  // Other fields from Google Flow credits payload
  [key: string]: unknown;
}

export interface GenerateImageRequest {
  prompt: string;
  project_id: UUID;
  aspect_ratio?: ImageAspectRatio;
  user_paygate_tier?: PaygateTier;
  character_media_ids?: UUID[] | null;
}

export interface GenerateVideoRequest {
  start_image_media_id: UUID;
  prompt: string;
  project_id: UUID;
  scene_id: UUID;
  aspect_ratio?: VideoAspectRatio;
  end_image_media_id?: UUID | null;
  user_paygate_tier?: PaygateTier;
}

export interface GenerateVideoRefsRequest {
  reference_media_ids: UUID[];
  prompt: string;
  project_id: UUID;
  scene_id: UUID;
  aspect_ratio?: VideoAspectRatio;
  user_paygate_tier?: PaygateTier;
}

export interface UpscaleVideoRequest {
  media_id: UUID;
  scene_id: UUID;
  aspect_ratio?: VideoAspectRatio;
  resolution?: VideoResolution;
}

export interface UploadImageRequest {
  file_path: string;
  project_id?: string;
  file_name?: string;
}

export interface UploadImageBinaryRequest {
  image_base64: string;
  mime_type?: string;
  project_id?: string;
  file_name?: string;
}

export interface UploadImageResponse {
  media_id: UUID;
  raw: unknown;
}

export interface ThumbnailRequest {
  prompt: string;
  character_names?: string[];
  aspect_ratio?: "LANDSCAPE" | "PORTRAIT";
  output_filename?: string;
}

export interface ThumbnailResponse {
  success: boolean;
  media_id?: UUID | null;
  image_url?: string | null;
  output_path?: string | null;
  prompt?: string | null;
  error?: string | null;
}

// ============ HEALTH ============

export interface HealthResponse {
  extension_connected: boolean;
  [key: string]: unknown;
}

// ============ MODELS CONFIG ============

export interface ModelsConfig {
  video_models: Record<string, Record<string, Record<string, string>>>;
  image_models: Record<string, string>;
  upscale_models: Record<string, string>;
}

// ============ ERROR ============

export interface ApiErrorBody {
  detail?: string | { msg: string; type: string }[];
}

// ============ WEBSOCKET (port 9222) ============

export interface WSMessage {
  type: string;
  request_id?: string;
  data?: unknown;
  [key: string]: unknown;
}
