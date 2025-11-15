import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ZoomLightbox from "./ZoomLightbox";

import japaImage from "@/assets/style-japandi.jpg";
import coastalImage from "@/assets/style-coastal.jpg";
import contemporaryImage from "@/assets/style-contemporary.jpg";
import midCenturyImage from "@/assets/style-mid-century.jpg";
import modernFarmhouseImage from "@/assets/style-modern-farmhouse.jpg";
import scandinavianImage from "@/assets/style-scandinavian.jpg";
import transitionalImage from "@/assets/style-transitional.jpg";

const STAGING_STYLES = [
  {
    id: "modern-farmhouse",
    name: "Modern Farmhouse",
    description: "Rustic charm meets contemporary comfort with natural wood and neutral tones",
    image: modernFarmhouseImage
  },
  {
    id: "japandi",
    name: "Japandi",
    description: "Minimalist blend of Japanese and Scandinavian design with clean lines and natural materials",
    image: japaImage
  },
  {
    id: "coastal",
    name: "Coastal",
    description: "Light, airy spaces with beach-inspired colors and natural textures",
    image: coastalImage
  },
  {
    id: "contemporary",
    name: "Contemporary",
    description: "Modern elegance with neutral palettes and sophisticated furnishings",
    image: contemporaryImage
  },
  {
    id: "mid-century",
    name: "Mid-Century Modern",
    description: "Iconic 1950s-60s design with clean lines and organic shapes",
    image: midCenturyImage
  },
  {
    id: "scandinavian",
    name: "Scandinavian",
    description: "Bright, minimalist design with functional furniture and cozy textiles",
    image: scandinavianImage
  },
  {
    id: "transitional",
    name: "Transitional",
    description: "Perfect balance of traditional and contemporary elements",
    image: transitionalImage
  }
];

interface StylesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function StylesModal({ open, onOpenChange }: StylesModalProps) {
  const [zoomImage, setZoomImage] = useState<{ url: string; name: string } | null>(null);

  const handleImageClick = (imageUrl: string, styleName: string) => {
    setZoomImage({ url: imageUrl, name: styleName });
  };

  const handleCloseZoom = () => {
    setZoomImage(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Staging Styles</DialogTitle>
            <DialogDescription>
              Explore our virtual staging styles and select the perfect look for your property. Click any image to zoom.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {STAGING_STYLES.map((style) => (
              <div
                key={style.id}
                className="group rounded-lg overflow-hidden border border-gray-200 hover:border-blue-500 transition-all hover:shadow-lg"
              >
                <div
                  className="relative aspect-[4/3] overflow-hidden cursor-zoom-in"
                  onClick={() => handleImageClick(style.image, style.name)}
                >
                  <img
                    src={style.image}
                    alt={style.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white bg-black/50 px-3 py-1 rounded text-sm">
                      Click to zoom
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2">{style.name}</h3>
                  <p className="text-sm text-gray-600">{style.description}</p>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {zoomImage && (
        <ZoomLightbox
          isOpen={!!zoomImage}
          imageUrl={zoomImage.url}
          imageName={zoomImage.name}
          onClose={handleCloseZoom}
        />
      )}
    </>
  );
}

export { STAGING_STYLES };
