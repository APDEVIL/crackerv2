"use client";

import { useState } from "react";
import {
  ImagePlus, Trash2, Edit2,
  EyeOff, Eye, Plus, Save, X, Images,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/trpc/react";
import { UploadButton } from "@/lib/uploadthing";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { RouterOutputs } from "@/trpc/react";

type Slide = RouterOutputs["slides"]["listAll"][number];

const EMPTY_FORM = {
  title: "",
  subtitle: "",
  ctaText: "Shop Now",
  ctaLink: "/products",
  badge: "",
  image: "",
};

export default function SlidesPage() {
  const utils = api.useUtils();

  const { data: slides = [], isLoading } = api.slides.listAll.useQuery();

  const createMutation = api.slides.create.useMutation({
    onSuccess: () => {
      utils.slides.listAll.invalidate();
      // Also invalidate public list so HeroCarousel updates immediately
      utils.slides.list.invalidate();
      toast.success("Slide created");
      setAddOpen(false);
      setForm(EMPTY_FORM);
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = api.slides.update.useMutation({
    onSuccess: () => {
      utils.slides.listAll.invalidate();
      utils.slides.list.invalidate();
      toast.success("Slide updated");
      setEditSlide(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = api.slides.delete.useMutation({
    onSuccess: () => {
      utils.slides.listAll.invalidate();
      utils.slides.list.invalidate();
      toast.success("Slide deleted");
    },
    onError: (err) => toast.error(err.message),
  });

  const [editSlide, setEditSlide] = useState<Slide | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  function handleAdd() {
    if (!form.title) return;
    createMutation.mutate({
      title: form.title,
      subtitle: form.subtitle,
      ctaText: form.ctaText,
      ctaLink: form.ctaLink,
      badge: form.badge || undefined,
      image: form.image,
      order: slides.length,
      isActive: true,
    });
  }

  function handleEditSave() {
    if (!editSlide) return;
    updateMutation.mutate({
      id: editSlide.id,
      title: editSlide.title,
      subtitle: editSlide.subtitle,
      ctaText: editSlide.ctaText,
      ctaLink: editSlide.ctaLink,
      badge: editSlide.badge ?? undefined,
      image: editSlide.image,
      isActive: editSlide.isActive,
    });
  }

  function handleToggleActive(slide: Slide) {
    updateMutation.mutate({
      id: slide.id,
      isActive: !slide.isActive,
    });
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-64 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Images className="h-5 w-5 text-[#D4380D]" />
          <div>
            <h1 className="font-serif text-2xl font-black text-gray-900">
              Hero Slides
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Manage the homepage carousel · {slides.length} slides
            </p>
          </div>
        </div>
        <Button
          onClick={() => setAddOpen(true)}
          className="gap-2 rounded-xl bg-[#D4380D] hover:bg-[#b82e08] text-white"
        >
          <Plus className="h-4 w-4" />
          Add Slide
        </Button>
      </div>

      {/* Slides grid */}
      {slides.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-orange-200 bg-orange-50/40 py-24 text-center">
          <span className="text-4xl">🖼️</span>
          <p className="text-sm text-gray-500">No slides yet. Add your first one!</p>
          <Button
            onClick={() => setAddOpen(true)}
            variant="outline"
            className="mt-1 rounded-xl"
          >
            Add Slide
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {slides.map((slide, idx) => (
            <div
              key={slide.id}
              className={cn(
                "group rounded-2xl border bg-white overflow-hidden transition",
                !slide.isActive
                  ? "border-gray-200 opacity-50"
                  : "border-orange-100 hover:shadow-sm hover:shadow-orange-100"
              )}
            >
              {/* Image */}
              <div className="relative h-40 bg-gray-100">
                {slide.image && slide.image.includes("utfs.io") ? (
                  <img
                    src={slide.image}
                    alt={slide.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-orange-100 to-amber-50">
                    <div className="text-center">
                      <span className="text-3xl">🎆</span>
                      <p className="text-xs text-gray-400 mt-1">No image uploaded</p>
                    </div>
                  </div>
                )}

                <div className="absolute top-2 left-2 flex gap-1.5">
                  <span className="rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white">
                    #{idx + 1}
                  </span>
                  {slide.badge && (
                    <span className="rounded-full bg-[#D4380D]/90 px-2 py-0.5 text-[10px] font-bold text-white">
                      {slide.badge}
                    </span>
                  )}
                </div>

                <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition">
                  <button
                    onClick={() => handleToggleActive(slide)}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-gray-600 shadow hover:bg-white"
                    title={slide.isActive ? "Hide slide" : "Show slide"}
                  >
                    {slide.isActive
                      ? <EyeOff className="h-3.5 w-3.5" />
                      : <Eye className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    onClick={() => setEditSlide(slide)}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-gray-600 shadow hover:bg-white"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate({ id: slide.id })}
                    disabled={deleteMutation.isPending}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-red-500 shadow hover:bg-white"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <p className="font-bold text-gray-900 text-sm truncate">{slide.title}</p>
                <p className="text-xs text-gray-400 truncate mt-0.5">{slide.subtitle}</p>
                <Separator className="my-3" />
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="truncate font-mono">{slide.ctaLink}</span>
                  <Badge className={cn(
                    "ml-2 shrink-0 rounded-full border-0 text-[10px]",
                    slide.isActive
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-400"
                  )}>
                    {slide.isActive ? "Visible" : "Hidden"}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Add Slide Dialog ─────────────────────────────── */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg font-black">
              Add New Slide
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">

            {/* UploadThing image upload */}
            <div>
              <Label className="text-xs text-gray-500 mb-1.5 block">
                Slide Image
              </Label>
              {form.image ? (
                <div className="relative h-36 w-full overflow-hidden rounded-xl">
                  <img
                    src={form.image}
                    className="h-full w-full object-cover"
                    alt="preview"
                  />
                  <button
                    onClick={() => setForm((f) => ({ ...f, image: "" }))}
                    className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <UploadButton
                  endpoint="slideImage"
                  onClientUploadComplete={(res) => {
                    const url = res[0]?.url;
                    if (url) setForm((f) => ({ ...f, image: url }));
                  }}
                  onUploadError={(err) => {toast.error(err.message)}}
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { key: "title", label: "Title", placeholder: "Celebrate Diwali" },
                { key: "subtitle", label: "Subtitle", placeholder: "With Premium Crackers" },
                { key: "ctaText", label: "Button Text", placeholder: "Shop Now" },
                { key: "ctaLink", label: "Button Link", placeholder: "/products" },
              ].map(({ key, label, placeholder }) => (
                <div key={key} className="space-y-1.5">
                  <Label className="text-xs text-gray-500">{label}</Label>
                  <Input
                    placeholder={placeholder}
                    value={form[key as keyof typeof form]}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, [key]: e.target.value }))
                    }
                    className="rounded-xl"
                  />
                </div>
              ))}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">Badge (optional)</Label>
              <Input
                placeholder="e.g. Diwali Collection 2025"
                value={form.badge}
                onChange={(e) => setForm((f) => ({ ...f, badge: e.target.value }))}
                className="rounded-xl"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={() => { setAddOpen(false); setForm(EMPTY_FORM); }}
              >
                <X className="h-4 w-4 mr-1" /> Cancel
              </Button>
              <Button
                className="flex-1 rounded-xl bg-[#D4380D] hover:bg-[#b82e08] text-white"
                onClick={handleAdd}
                disabled={!form.title || createMutation.isPending}
              >
                <Save className="h-4 w-4 mr-1" />
                {createMutation.isPending ? "Saving..." : "Save Slide"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Edit Slide Dialog ────────────────────────────── */}
      <Dialog
        open={!!editSlide}
        onOpenChange={() => setEditSlide(null)}
      >
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg font-black">
              Edit Slide
            </DialogTitle>
          </DialogHeader>
          {editSlide && (
            <div className="space-y-4 pt-1">

              {/* Image */}
              <div>
                <Label className="text-xs text-gray-500 mb-1.5 block">
                  Slide Image
                </Label>
                {editSlide.image ? (
                  <div className="relative h-36 w-full overflow-hidden rounded-xl">
                    <img
                      src={editSlide.image}
                      className="h-full w-full object-cover"
                      alt="preview"
                    />
                    <button
                      onClick={() =>
                        setEditSlide((s) => s ? { ...s, image: "" } : s)
                      }
                      className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <UploadButton
                    endpoint="slideImage"
                    onClientUploadComplete={(res) => {
                      const url = res[0]?.url;
                      if (url)
                        setEditSlide((s) => s ? { ...s, image: url } : s);
                    }}
                    onUploadError={(err) => { toast.error(err.message); }}
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: "title", label: "Title" },
                  { key: "subtitle", label: "Subtitle" },
                  { key: "ctaText", label: "Button Text" },
                  { key: "ctaLink", label: "Button Link" },
                ].map(({ key, label }) => (
                  <div key={key} className="space-y-1.5">
                    <Label className="text-xs text-gray-500">{label}</Label>
                    <Input
                      value={editSlide[key as keyof Slide] as string ?? ""}
                      onChange={(e) =>
                        setEditSlide((s) =>
                          s ? { ...s, [key]: e.target.value } : s
                        )
                      }
                      className="rounded-xl"
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500">Badge (optional)</Label>
                <Input
                  value={editSlide.badge ?? ""}
                  onChange={(e) =>
                    setEditSlide((s) =>
                      s ? { ...s, badge: e.target.value } : s
                    )
                  }
                  className="rounded-xl"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl"
                  onClick={() => setEditSlide(null)}
                >
                  <X className="h-4 w-4 mr-1" /> Cancel
                </Button>
                <Button
                  className="flex-1 rounded-xl bg-[#D4380D] hover:bg-[#b82e08] text-white"
                  onClick={handleEditSave}
                  disabled={updateMutation.isPending}
                >
                  <Save className="h-4 w-4 mr-1" />
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}