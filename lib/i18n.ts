import type { GenerationAction, GenerationStyle, ImageSize } from '@/lib/image-generation';

export const LOCALES = ['vi', 'en'] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'vi';
export const LANGUAGE_STORAGE_KEY = 'imaginex-locale';

type PresetMessages = {
  actions: Record<GenerationAction, { label: string; description: string }>;
  styles: Record<GenerationStyle, { label: string; description: string }>;
  sizes: Record<ImageSize, { label: string }>;
};

type MessageShape = {
  app: {
    logoAlt: string;
    title: string;
    subtitle: string;
    textToImage: string;
    imageToImage: string;
    sessionGallery: (count: number) => string;
    footer: string;
    tokens: string;
    tokenLimit: string;
    rateLimitTitle: string;
    rateLimitDescription: string;
    resetTimerLabel: string;
  };
  promptInput: {
    promptLabel: string;
    promptHint: string;
    enhancePrompt: string;
    enhancingPrompt: string;
    textPlaceholder: string;
    imagePlaceholder: string;
    generating: string;
    generateImage: string;
    uploadImageFirst: string;
    uploadTitle: string;
    uploadHint: string;
    browseFiles: string;
    clearFile: string;
    bestResultsHint: string;
    selectedUploadPreviewAlt: string;
  };
  imageCanvas: {
    generatingTitle: string;
    generatingHint: string;
    emptyTitle: string;
    emptyHintTextToImage: string;
    emptyHintImageToImage: string;
    livePreview: string;
    sessionImages: (count: number) => string;
    download: string;
    clearGallery: string;
    clickToPreview: string;
    generatingNextVariation: string;
    gallery: string;
    view: string;
    lightboxTitle: string;
    dragToMove: string;
    zoomOutTitle: string;
    resetZoomTitle: string;
    zoomInTitle: string;
    close: string;
    previousImage: string;
    nextImage: string;
    imageCounter: (index: number, total: number) => string;
    generatedPreviewAlt: (index: number) => string;
    generatedImageAlt: (index: number) => string;
    lightboxPreviewAlt: (index: number) => string;
  };
  controlPanel: {
    quickSetup: string;
    quickSetupDescription: string;
    action: string;
    style: string;
    outputSize: string;
    advanced: string;
    steps: string;
    fixedStepsDescription: string;
    guidance: string;
    guidanceDescription: string;
    seed: string;
    seedPlaceholder: string;
    random: string;
    seedDescription: string;
    resetAllSettings: string;
    selectAction: string;
    selectStyle: string;
    selectSize: string;
    requiresImageSuffix: string;
  };
  errors: {
    referenceLabel: string;
    imageGenerationFailed: string;
    apiResponseMissingImage: string;
    promptRequiredForOptimization: string;
    promptRewriteFailed: string;
    promptRewriteMissingContent: string;
    promptRewriteEmptyOutput: string;
    promptRequiredTextToImage: string;
    unexpectedServerError: string;
    missingCloudflareToken: string;
    missingCloudflareImageEndpoint: string;
    missingCloudflareTextEndpoint: string;
    cloudflareRequestFailed: string;
    cloudflareNoImage: string;
    contentFlaggedTextToImage: string;
    contentFlaggedImageToImage: string;
    rateLimited: string;
  };
  presets: PresetMessages;
};

const messages = {
  vi: {
    app: {
      logoAlt: 'Logo Imaginex',
      title: 'Studio tạo ảnh AI',
      subtitle: 'Viết prompt, tinh chỉnh, xem trước và so sánh trong cùng một quy trình.\nSản phẩm tạo ra theo đơn đặt hàng của D và không nhằm mục đích thương mại 😆😆',
      textToImage: 'Văn bản sang ảnh',
      imageToImage: 'Ảnh sang ảnh',
      sessionGallery: (count) => `Thư viện phiên: ${count} ảnh`,
      footer: 'Thực hiện bởi Nguyễn Duy Thắng',
      tokens: 'Tokens',
      tokenLimit: 'Giới hạn Token',
      rateLimitTitle: 'Đã hết giới hạn sử dụng trong ngày',
      rateLimitDescription: 'Tuyệt vời, bạn đã sáng tạo hết công suất cho hôm nay! Gói Cloudflare Free hiện tại cấp 10,000 Neurons miễn phí mỗi ngày và bạn đã xài hết. Hạn mức sẽ được làm mới lúc 00:00 UTC. Hãy nghỉ ngơi và quay lại sau nhé!',
      resetTimerLabel: 'Thời gian chờ đến 00:00 UTC',
    },
    promptInput: {
      promptLabel: 'Prompt',
      promptHint: 'Viết tự nhiên, sau đó dùng Tạo prompt để tối ưu chất lượng ảnh.',
      enhancePrompt: 'Tạo prompt',
      enhancingPrompt: 'Đang tối ưu...',
      textPlaceholder:
        'Mô tả ảnh bạn muốn tạo... (ví dụ: chân dung điện ảnh của một huyền thoại bóng đá dưới ánh đèn sân vận động, chi tiết cao, bầu không khí kịch tính)',
      imagePlaceholder: 'Mô tả thay đổi bạn muốn áp dụng... (không bắt buộc)',
      generating: 'Đang tạo...',
      generateImage: 'Tạo ảnh',
      uploadImageFirst: 'Tải ảnh lên trước',
      uploadTitle: 'Kéo ảnh vào đây',
      uploadHint: 'hoặc bấm để chọn tệp',
      browseFiles: 'Chọn tệp',
      clearFile: 'Xóa tệp',
      bestResultsHint: 'Kết quả tốt nhất thường đến từ ảnh có kích thước 512x512 trở xuống.',
      selectedUploadPreviewAlt: 'Xem trước ảnh đã chọn',
    },
    imageCanvas: {
      generatingTitle: 'Đang tạo ảnh...',
      generatingHint: 'Khung xem trước sẽ tự động cập nhật.',
      emptyTitle: 'Ảnh xem trước sẽ xuất hiện ở đây',
      emptyHintTextToImage: 'Viết prompt và tạo bức ảnh đầu tiên.',
      emptyHintImageToImage: 'Tải ảnh nguồn lên, mô tả chỉnh sửa, rồi tạo ảnh.',
      livePreview: 'Xem trước trực tiếp',
      sessionImages: (count) => `${count} ảnh trong phiên này`,
      download: 'Tải xuống',
      clearGallery: 'Xóa thư viện',
      clickToPreview: 'Bấm để xem lớn',
      generatingNextVariation: 'Đang tạo biến thể tiếp theo...',
      gallery: 'Thư viện',
      view: 'Xem',
      lightboxTitle: 'Xem lớn ảnh đã tạo',
      dragToMove: 'Kéo để di chuyển',
      zoomOutTitle: 'Thu nhỏ',
      resetZoomTitle: 'Đặt lại mức zoom',
      zoomInTitle: 'Phóng to',
      close: 'Đóng',
      previousImage: 'Ảnh trước',
      nextImage: 'Ảnh tiếp theo',
      imageCounter: (index, total) => `${index} / ${total}`,
      generatedPreviewAlt: (index) => `Ảnh xem trước ${index + 1}`,
      generatedImageAlt: (index) => `Ảnh đã tạo ${index + 1}`,
      lightboxPreviewAlt: (index) => `Xem lớn ảnh ${index + 1}`,
    },
    controlPanel: {
      quickSetup: 'Thiết lập nhanh',
      quickSetupDescription: 'Điều khiển gọn, trạng thái chọn rõ ràng.',
      action: 'Hành động',
      style: 'Phong cách',
      outputSize: 'Kích thước đầu ra',
      advanced: 'Nâng cao',
      steps: 'Số bước',
      fixedStepsDescription: 'Mô hình này dùng số bước cố định.',
      guidance: 'Độ bám prompt',
      guidanceDescription: 'Giá trị cao hơn sẽ bám prompt chặt hơn.',
      seed: 'Seed',
      seedPlaceholder: '-1 để ngẫu nhiên',
      random: 'Ngẫu nhiên',
      seedDescription: 'Dùng cùng seed để giữ bố cục ổn định.',
      resetAllSettings: 'Đặt lại toàn bộ thiết lập',
      selectAction: 'Chọn hành động',
      selectStyle: 'Chọn phong cách',
      selectSize: 'Chọn kích thước',
      requiresImageSuffix: 'cần ảnh',
    },
    errors: {
      referenceLabel: 'Mã',
      imageGenerationFailed: 'Tạo ảnh thất bại.',
      apiResponseMissingImage: 'Phản hồi từ API không chứa ảnh.',
      promptRequiredForOptimization: 'Cần có prompt để tạo prompt tối ưu.',
      promptRewriteFailed: 'Không thể tạo prompt tối ưu.',
      promptRewriteMissingContent: 'Phản hồi tối ưu prompt không có nội dung.',
      promptRewriteEmptyOutput: 'Prompt tối ưu rỗng sau khi làm sạch dữ liệu.',
      promptRequiredTextToImage: 'Cần có prompt cho chế độ văn bản sang ảnh.',
      unexpectedServerError: 'Máy chủ gặp lỗi không mong đợi.',
      missingCloudflareToken:
        'Thiếu Cloudflare token. Hãy cài đặt CLOUDFLARE_API_TOKEN ưu tiên hoặc CLOUDFLARE_AUTH_TOKEN.',
      missingCloudflareImageEndpoint:
        'Thiếu cấu hình endpoint image của Cloudflare. Hãy cài đặt CLOUDFLARE_API_URL hoặc CLOUDFLARE_ACCOUNT_ID.',
      missingCloudflareTextEndpoint:
        'Thiếu cấu hình endpoint text của Cloudflare. Hãy cài đặt CLOUDFLARE_TEXT_API_URL hoặc CLOUDFLARE_ACCOUNT_ID.',
      cloudflareRequestFailed: 'Yêu cầu đến Cloudflare thất bại.',
      cloudflareNoImage: 'Phản hồi từ Cloudflare không chứa ảnh.',
      contentFlaggedTextToImage:
        'Bộ lọc an toàn của Cloudflare đã chặn prompt này. Hãy dùng câu từ an toàn hơn, tránh nội dung nhạy cảm, hoặc chọn style hay action ít rủi ro hơn.',
      contentFlaggedImageToImage:
        'Bộ lọc an toàn của Cloudflare đã chặn prompt hoặc ảnh đầu vào này. Hãy dùng prompt an toàn hơn, tránh nội dung nhạy cảm, hoặc đổi ảnh đầu vào.',
      rateLimited: 'Đã hết giới hạn ngày của Cloudflare. Hẹn bạn vào ngày mai!',
    },
    presets: {
      actions: {
        create: {
          label: 'Tạo từ đầu',
          description: 'Tạo một bức ảnh hoàn toàn mới từ đầu.',
        },
        transform: {
          label: 'Biến đổi ảnh',
          description:
            'Dùng ảnh tải lên làm nền và áp dụng các thay đổi bạn yêu cầu trong khi vẫn giữ chủ thể để nhận ra.',
        },
        'style-transfer': {
          label: 'Chuyển phong cách',
          description:
            'Giữ bố cục và vị trí chủ thể, sau đó đổi phong cách theo diện mạo mong muốn.',
        },
        'product-shot': {
          label: 'Ảnh sản phẩm',
          description:
            'Tạo ảnh sản phẩm thương mại với ánh sáng studio sạch và cách trình bày cao cấp.',
        },
        portrait: {
          label: 'Chân dung',
          description:
            'Tạo hoặc cải thiện ảnh chân dung với da tự nhiên, ánh sáng cân bằng và chi tiết khuôn mặt sắc nét.',
        },
        'background-replace': {
          label: 'Thay nền',
          description: 'Giữ nguyên chủ thể và thay nền theo prompt.',
        },
      },
      styles: {
        cinematic: {
          label: 'Điện ảnh',
          description: 'Ánh sáng điện ảnh, tương phản mạnh và màu phim.',
        },
        photorealistic: {
          label: 'Siêu thực',
          description: 'Màu sắc tự nhiên và bề mặt chi tiết cao.',
        },
        anime: {
          label: 'Anime',
          description: 'Nét vẽ sạch, biểu cảm rõ và màu sắc tươi.',
        },
        watercolor: {
          label: 'Màu nước',
          description: 'Mảng màu mềm, cạnh dịu và cảm giác vẽ tay.',
        },
        'oil-painting': {
          label: 'Sơn dầu',
          description: 'Nét cọ đậm, giàu chất liệu và bố cục cổ điển.',
        },
        'digital-art': {
          label: 'Digital Art',
          description: 'Minh họa số sắc nét, gọn gàng và hoàn thiện.',
        },
        neon: {
          label: 'Neon',
          description: 'Ánh sáng rực, tương phản cao và điểm nhấn phát quang.',
        },
        cyberpunk: {
          label: 'Cyberpunk',
          description: 'Không khí tương lai, đèn neon đô thị và chi tiết công nghệ.',
        },
      },
      sizes: {
        '1024x1024': { label: 'Vuông 1:1' },
        '1280x720': { label: 'Ngang 16:9' },
        '720x1280': { label: 'Dọc 9:16' },
        '1536x1024': { label: 'Rộng 3:2' },
        '1024x1536': { label: 'Cao 2:3' },
      },
    },
  },
  en: {
    app: {
      logoAlt: 'Imaginex logo',
      title: 'AI Image Studio',
      subtitle: 'Produced by special order for D and is not for commercial use 😆😆',
      textToImage: 'Text to Image',
      imageToImage: 'Image to Image',
      sessionGallery: (count) => `Session gallery: ${count} image${count === 1 ? '' : 's'}`,
      footer: 'Built by Nguyễn Duy Thắng',
      tokens: 'Tokens',
      tokenLimit: 'Token Limit',
      rateLimitTitle: 'Daily Limit Reached',
      rateLimitDescription: 'Awesome, you have exhausted your creative power for today! You have used up the daily 10,000 free Neurons on Cloudflare. The limit will magically reset at 00:00 UTC.',
      resetTimerLabel: 'Time until 00:00 UTC reset',
    },
    promptInput: {
      promptLabel: 'Prompt',
      promptHint: 'Write naturally, then use Generate Prompt to optimize image quality.',
      enhancePrompt: 'Generate Prompt',
      enhancingPrompt: 'Optimizing...',
      textPlaceholder:
        'Describe your image... (e.g., cinematic portrait of a football legend in stadium lighting, high detail, dramatic atmosphere)',
      imagePlaceholder: 'Describe the changes you want to make... (optional)',
      generating: 'Generating...',
      generateImage: 'Generate Image',
      uploadImageFirst: 'Upload Image First',
      uploadTitle: 'Drag your image here',
      uploadHint: 'or click to select a file',
      browseFiles: 'Browse Files',
      clearFile: 'Clear File',
      bestResultsHint: 'Best results come from images at or below 512x512.',
      selectedUploadPreviewAlt: 'Selected upload preview',
    },
    imageCanvas: {
      generatingTitle: 'Generating your image...',
      generatingHint: 'The canvas will update automatically.',
      emptyTitle: 'Preview will appear here',
      emptyHintTextToImage: 'Write a prompt and generate your first image.',
      emptyHintImageToImage: 'Upload a source image, describe edits, then generate.',
      livePreview: 'Live Preview',
      sessionImages: (count) => `${count} image${count === 1 ? '' : 's'} in this session`,
      download: 'Download',
      clearGallery: 'Clear Gallery',
      clickToPreview: 'Click to preview',
      generatingNextVariation: 'Generating next variation...',
      gallery: 'Gallery',
      view: 'View',
      lightboxTitle: 'Generated image lightbox preview',
      dragToMove: 'Drag to move',
      zoomOutTitle: 'Zoom out',
      resetZoomTitle: 'Reset zoom',
      zoomInTitle: 'Zoom in',
      close: 'Close',
      previousImage: 'Previous image',
      nextImage: 'Next image',
      imageCounter: (index, total) => `${index} / ${total}`,
      generatedPreviewAlt: (index) => `Generated preview ${index + 1}`,
      generatedImageAlt: (index) => `Generated image ${index + 1}`,
      lightboxPreviewAlt: (index) => `Lightbox preview ${index + 1}`,
    },
    controlPanel: {
      quickSetup: 'Quick Setup',
      quickSetupDescription: 'Compact controls with clean selection states.',
      action: 'Action',
      style: 'Style',
      outputSize: 'Output Size',
      advanced: 'Advanced',
      steps: 'Steps',
      fixedStepsDescription: 'This model uses a fixed step count.',
      guidance: 'Guidance',
      guidanceDescription: 'Higher values follow the prompt more strictly.',
      seed: 'Seed',
      seedPlaceholder: '-1 for random',
      random: 'Random',
      seedDescription: 'Use the same seed to keep composition reproducible.',
      resetAllSettings: 'Reset All Settings',
      selectAction: 'Select action',
      selectStyle: 'Select style',
      selectSize: 'Select size',
      requiresImageSuffix: 'requires image',
    },
    errors: {
      referenceLabel: 'Ref',
      imageGenerationFailed: 'Image generation failed.',
      apiResponseMissingImage: 'The API response did not include an image.',
      promptRequiredForOptimization: 'Prompt is required to generate an optimized prompt.',
      promptRewriteFailed: 'Failed to generate an optimized prompt.',
      promptRewriteMissingContent: 'Prompt rewrite response did not include content.',
      promptRewriteEmptyOutput: 'Prompt rewrite returned empty output after sanitization.',
      promptRequiredTextToImage: 'Prompt is required for text-to-image.',
      unexpectedServerError: 'Unexpected server error.',
      missingCloudflareToken:
        'Missing Cloudflare token. Set CLOUDFLARE_API_TOKEN (preferred) or CLOUDFLARE_AUTH_TOKEN.',
      missingCloudflareImageEndpoint:
        'Missing Cloudflare image endpoint configuration. Set CLOUDFLARE_API_URL or CLOUDFLARE_ACCOUNT_ID.',
      missingCloudflareTextEndpoint:
        'Missing Cloudflare text endpoint configuration. Set CLOUDFLARE_TEXT_API_URL or CLOUDFLARE_ACCOUNT_ID.',
      cloudflareRequestFailed: 'Cloudflare request failed.',
      cloudflareNoImage: 'Cloudflare response did not include an image.',
      contentFlaggedTextToImage:
        'Cloudflare safety filter blocked this prompt. Try safer wording, avoid sensitive terms, or switch to a less risky style or action.',
      contentFlaggedImageToImage:
        'Cloudflare safety filter blocked this prompt or input image. Try a safer prompt, avoid sensitive terms, or change the input image.',
      rateLimited: 'Cloudflare daily limit exhausted. Please try again tomorrow!',
    },
    presets: {
      actions: {
        create: {
          label: 'Create from scratch',
          description: 'Generate a brand new image from scratch.',
        },
        transform: {
          label: 'Transform image',
          description:
            'Use the uploaded image as the base and apply the requested changes while keeping the subject recognizable.',
        },
        'style-transfer': {
          label: 'Style transfer',
          description:
            'Preserve the composition and subject placement, then restyle the image to match the requested look.',
        },
        'product-shot': {
          label: 'Product shot',
          description:
            'Create a polished commercial product image with clean studio lighting and premium presentation.',
        },
        portrait: {
          label: 'Portrait',
          description:
            'Create or enhance a flattering portrait with natural skin texture, balanced lighting, and sharp facial detail.',
        },
        'background-replace': {
          label: 'Background replace',
          description: 'Keep the subject consistent and replace the background according to the prompt.',
        },
      },
      styles: {
        cinematic: {
          label: 'Cinematic',
          description: 'Cinematic lighting, dramatic contrast, and filmic color grading.',
        },
        photorealistic: {
          label: 'Photorealistic',
          description: 'Natural colors and ultra-detailed textures.',
        },
        anime: {
          label: 'Anime',
          description: 'Clean line art, expressive faces, and vibrant colors.',
        },
        watercolor: {
          label: 'Watercolor',
          description: 'Soft edges, paper texture, and a hand-painted feel.',
        },
        'oil-painting': {
          label: 'Oil Painting',
          description: 'Rich brushstrokes and a classical composition.',
        },
        'digital-art': {
          label: 'Digital Art',
          description: 'Polished illustration with crisp rendering.',
        },
        neon: {
          label: 'Neon',
          description: 'High contrast and luminous accents.',
        },
        cyberpunk: {
          label: 'Cyberpunk',
          description: 'A futuristic mood with neon city lights and tech detail.',
        },
      },
      sizes: {
        '1024x1024': { label: '1:1 Square' },
        '1280x720': { label: '16:9 Landscape' },
        '720x1280': { label: '9:16 Portrait' },
        '1536x1024': { label: '3:2 Wide' },
        '1024x1536': { label: '2:3 Tall' },
      },
    },
  },
} as const satisfies Record<Locale, MessageShape>;

export type Messages = (typeof messages)[Locale];

export function isLocale(value: string | null | undefined): value is Locale {
  return value === 'vi' || value === 'en';
}

export function getMessages(locale: Locale): Messages {
  return messages[locale];
}
