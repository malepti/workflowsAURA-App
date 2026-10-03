import React, { useState } from 'react';
import {
  Sparkles,
  Download,
  Image as ImageIcon,
  Sliders,
  Ratio,
  Palette,
  RefreshCw,
  Eye,
  Check
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ImageGenView: React.FC = () => {
  const { deductCredits, executionMode, addToast } = useApp();
  const [prompt, setPrompt] = useState('Futuristic minimalist glass computer on a clean white desk, soft ambient violet glow, high aesthetic octane render');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16'>('16:9');
  const [style, setStyle] = useState('Photorealistic 3D');
  const [isGenerating, setIsGenerating] = useState(false);

  const [gallery, setGallery] = useState([
    {
      id: 'img_1',
      url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=600',
      prompt: 'Abstract liquid violet glass geometric waves, soft daylight, 8k resolution',
      aspectRatio: '16:9',
      style: '3D Render',
      timestamp: 'Today at 01:30'
    },
    {
      id: 'img_2',
      url: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&q=80&w=600',
      prompt: 'Minimalist AI workspace studio with glowing lavender neon and futuristic server rack',
      aspectRatio: '1:1',
      style: 'Cyberpunk Aesthetic',
      timestamp: 'Yesterday'
    }
  ]);

  const handleGenerate = () => {
    if (!prompt.trim()) return;

    if (executionMode === 'platform_managed') {
      const ok = deductCredits(5, 'Image Generation Studio (High Res)');
      if (!ok) return;
    }

    setIsGenerating(true);
    addToast('Generating image with AI model...', 'info');

    setTimeout(() => {
      setIsGenerating(false);
      const newImg = {
        id: `img_${Date.now()}`,
        url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=600',
        prompt,
        aspectRatio,
        style,
        timestamp: 'Just now'
      };
      setGallery((prev) => [newImg, ...prev]);
      addToast('Image generated successfully!', 'success');
    }, 1500);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFF] p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-indigo-600 font-semibold text-xs mb-1">
          <ImageIcon className="h-4 w-4" />
          <span>AURA CREATIVE STUDIO</span>
        </div>
        <h1 className="text-2xl font-bold text-[#172554]">Image Generation Studio</h1>
        <p className="text-xs text-slate-500">
          Transform natural language descriptions into high-resolution visual art and product mockups.
        </p>
      </div>

      {/* Generator Controls Card */}
      <div className="rounded-3xl border border-indigo-100 bg-white p-6 shadow-2xs space-y-5">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Prompt Description
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            placeholder="Describe what you want to see in detail..."
            className="w-full rounded-2xl border border-slate-200 bg-[#F8FAFF] p-3 text-xs text-slate-800 focus:border-indigo-400 focus:bg-white focus:outline-none"
          />
        </div>

        {/* Aspect Ratio and Style controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Ratio className="h-3.5 w-3.5 text-indigo-600" />
              Aspect Ratio
            </label>
            <div className="flex gap-2">
              {(['1:1', '16:9', '9:16'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setAspectRatio(r)}
                  className={`flex-1 rounded-xl py-2 text-xs font-semibold border transition-all ${
                    aspectRatio === r
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Palette className="h-3.5 w-3.5 text-indigo-600" />
              Style Preset
            </label>
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-indigo-400 focus:outline-none"
            >
              <option value="Photorealistic 3D">Photorealistic 3D Octane</option>
              <option value="Anime / Manga">Anime & Manga Art</option>
              <option value="Cyberpunk Aesthetic">Cyberpunk Neon</option>
              <option value="Minimalist Vector">Minimalist SaaS Vector</option>
              <option value="Oil Painting">Classic Oil Painting</option>
            </select>
          </div>
        </div>

        {/* Generate Button */}
        <div className="pt-2 flex items-center justify-between border-t border-slate-100">
          <span className="text-xs text-slate-400">
            Cost: <strong className="text-slate-700">5 credits</strong> per generation
          </span>
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-semibold text-white shadow-2xs hover:bg-indigo-700 transition-all disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Rendering Asset...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Generate Artwork</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Generated Gallery */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          Generation History & Gallery
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {gallery.map((img) => (
            <div
              key={img.id}
              className="group rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="relative aspect-video overflow-hidden bg-slate-100">
                <img
                  src={img.url}
                  alt={img.prompt}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-2 right-2 rounded-full bg-slate-900/60 backdrop-blur-xs px-2 py-0.5 text-[10px] font-semibold text-white">
                  {img.style}
                </span>
              </div>
              <div className="p-4">
                <p className="text-xs text-slate-700 font-medium line-clamp-2 mb-2">
                  {img.prompt}
                </p>
                <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100 pt-2">
                  <span>{img.timestamp}</span>
                  <button
                    onClick={() => addToast('Image download started.', 'success')}
                    className="flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    <Download className="h-3 w-3" /> Save PNG
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
