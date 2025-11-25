import React, { useState } from "react";
import { toast } from "react-toastify";
import { Upload, Trash2 } from "lucide-react";

interface Image {
  url: string;
  file?: File;
  id?: number;
  isPrimary?: boolean;
}

interface ImageUploaderProps {
  label: string;
  images: Image[];
  setImages: React.Dispatch<React.SetStateAction<Image[]>>;
  multiple?: boolean;
  required?: boolean;
  isMainImage?: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ label, images = [], setImages, multiple = false, isMainImage = false, required = false }) => {
  const [showAll, setShowAll] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const filesArray: Image[] = Array.from(e.target.files).map((file) => ({
      url: URL.createObjectURL(file),
      file,
      isPrimary: isMainImage ? true : undefined,
    }));

    const currentImages = Array.isArray(images) ? images : [];

    if (multiple) {
      const totalImages = currentImages.length + filesArray.length;
      if (!isMainImage && totalImages > 20) {
        toast.error("You can upload a maximum of 20 alt images.", { autoClose: 3000 });
        const allowedFiles = filesArray.slice(0, 20 - currentImages.length);
        setImages([...currentImages, ...allowedFiles]);
        return;
      }
      setImages([...currentImages, ...filesArray]);
    } else {
      setImages(filesArray);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const safeImages = Array.isArray(images) ? images : [];
  const displayedImages = !isMainImage && !showAll ? safeImages.slice(0, 1) : safeImages;
  const labelWithRequired = `${label}${required ? " *" : ""}`;

  return (
    <div className="flex flex-col">
      <label className="flex items-center justify-center gap-2 w-[250px] h-[50px] mb-2 px-4 py-2 border border-[#272324] text-[#272324] text-sm font-medium
       rounded-md cursor-pointer hover:bg-[#272324]/5 transition" >
        <Upload className="w-4 h-4" />
        <span>Upload {labelWithRequired}</span>
        <input type="file" hidden accept=".jpg,.jpeg,.png" multiple={multiple} onChange={handleFileChange} />
      </label>


      <div className="flex flex-wrap gap-3">
        {displayedImages.map((img, i) => (
          <div key={i}
            className={`relative border border-gray-300 rounded-md overflow-hidden p-1 ${isMainImage ? "w-[120px] h-[120px]" : "w-[100px] h-[100px]"}`} >
            <img src={img.url} alt={`${label}-${i}`} className="w-full h-full object-contain rounded-md" />

            <button type="button" onClick={() => removeImage(i)}
              className="absolute top-1.5 right-1.5 p-1 bg-black/60 text-white rounded-md hover:bg-red-600 transition" >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {!isMainImage && images.length > 1 && (
        <div className="w-full flex justify-start">
          <button type="button" onClick={() => setShowAll((prev) => !prev)}
            className="mt-2 text-sm text-orange-600 hover:text-orange-700 font-medium transition" >
            {showAll ? "Show Less" : `Show More (+${images.length - 1})`}
          </button>
        </div>

      )}
    </div>
  );
};

export default ImageUploader;
