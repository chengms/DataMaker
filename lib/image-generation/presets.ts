import type { ImageStylePreset } from "@/types/settings";

export const IMAGE_STYLE_PRESET_LABELS: Record<ImageStylePreset, string> = {
  realistic: "通用写实",
  tech_illustration: "科技感插画",
  minimal_flat: "极简扁平插画",
  editorial: "杂志 editorial",
  xiaohongshu_lifestyle: "小红书清新生活感",
  business_poster: "商业海报风",
  modern_3d: "现代 3D 插画",
};

export const IMAGE_STYLE_PRESET_PROMPTS: Record<ImageStylePreset, string> = {
  realistic: "realistic visual, natural lighting, believable details",
  tech_illustration: "tech illustration, futuristic interface accents, clean digital composition",
  minimal_flat: "minimal flat illustration, simplified shapes, restrained color palette",
  editorial: "editorial magazine visual, premium composition, cinematic lighting",
  xiaohongshu_lifestyle: "fresh lifestyle photography for Xiaohongshu, warm natural mood, clean scene styling",
  business_poster: "business poster visual, bold focal point, marketing-ready layout",
  modern_3d: "modern 3D illustration, soft depth, polished materials",
};

export const IMAGE_NEGATIVE_HINT =
  "avoid blurry details, distorted hands, irrelevant people, unreadable text overlays, generic stock-photo feeling";
