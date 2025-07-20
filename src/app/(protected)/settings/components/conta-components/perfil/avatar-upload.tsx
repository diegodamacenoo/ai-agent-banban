'use client';

import * as React from 'react';
import { useToast } from '@/shared/ui/toast';
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { CameraIcon } from "lucide-react";
import { getUserInitials } from "@/shared/utils/get-user-initials";
import type { UserData } from "@/app/contexts/UserContext";
import { CropAvatarDialog } from './crop-avatar-dialog';
import { Button } from '@/shared/ui/button';

interface AvatarUploadProps {
  profile: UserData | null;
  currentFormAvatarUrl: string | null;
  setCurrentFormAvatarUrl: (url: string | null) => void;
  onImageCrop?: (croppedBlob: Blob | null) => void;
  disabled?: boolean;
}

export default function AvatarUpload({
  const { toast } = useToast();

  profile,
  currentFormAvatarUrl,
  setCurrentFormAvatarUrl,
  onImageCrop,
  disabled = false,
}: AvatarUploadProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const [cropDialogOpen, setCropDialogOpen] = React.useState(false);
  const [imageToCrop, setImageToCrop] = React.useState<string | null>(null);
  const [originalAvatarUrl, setOriginalAvatarUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    setOriginalAvatarUrl(currentFormAvatarUrl || profile?.avatar_url || null);
  }, [profile, currentFormAvatarUrl]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.debug('AvatarUpload - handleFileSelect event:', e.target.files);
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      console.debug('AvatarUpload - selected file:', file);
      if (!file.type.startsWith('image/')) {
        toast.error("Por favor, selecione um arquivo de imagem.", {
          title: "Arquivo invÃ¡lido",
        });
        return;
      }
      const reader = new FileReader();
      reader.addEventListener('loadstart', () => console.debug('AvatarUpload - FileReader loadstart'));
      reader.addEventListener('load', () => {
        console.debug('AvatarUpload - FileReader result:', reader.result);
        setImageToCrop(reader.result as string);
        setCropDialogOpen(true);
      });
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCropComplete = (croppedImageBlob: Blob | null) => {
    console.debug('AvatarUpload - handleCropComplete called with blob:', croppedImageBlob);
    if (!croppedImageBlob) {
      setCurrentFormAvatarUrl(originalAvatarUrl);
      setCropDialogOpen(false);
      setImageToCrop(null);
      toast.info("Nenhuma alteraÃ§Ã£o foi feita no avatar.", {
        title: "Recorte Cancelado",
      });
      return;
    }

    const previewUrl = URL.createObjectURL(croppedImageBlob);
    console.debug('AvatarUpload - previewUrl created:', previewUrl);
    setCurrentFormAvatarUrl(previewUrl);
    setCropDialogOpen(false);
    setImageToCrop(null);
    if (onImageCrop) {
      onImageCrop(croppedImageBlob);
    }
  };

  const handleRemoveAvatar = () => {
    setCurrentFormAvatarUrl(null);
    setOriginalAvatarUrl(null);
    setCropDialogOpen(false);
    setImageToCrop(null);
    if (onImageCrop) {
      onImageCrop(null);
    }
    toast.info("O avatar serÃ¡ removido ao salvar as alteraÃ§Ãµes do perfil.", {
      title: "Avatar Removido",
    });
  };

  const userInitials = getUserInitials(profile?.first_name, profile?.last_name);
  const displayAvatarUrl = currentFormAvatarUrl;

  return (
    <>
      <div className="flex flex-col items-center justify-start gap-4 w-32">
        <div className="relative">
          <Avatar className="w-32 h-32 border-4 border-primary/10 text-3xl">
            <AvatarImage 
              src={displayAvatarUrl || undefined} 
              alt="Avatar do usuÃ¡rio" 
            />
            <AvatarFallback>{userInitials}</AvatarFallback>
          </Avatar>
          {!disabled && (
            <div
              className="absolute bottom-1 right-1 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/80 transition-colors"
              onClick={() => fileInputRef.current?.click()}
              title="Alterar avatar"
            >
              <CameraIcon className="w-4 h-4" />
              <input 
                id="avatarUploadInput"
                type="file" 
                className="sr-only" 
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileSelect}
                disabled={disabled}
              />
            </div>
          )}
        </div>
        {displayAvatarUrl && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemoveAvatar}
            disabled={disabled}
            className="text-xs text-muted-foreground hover:text-destructive"
          >
            Remover
          </Button>
        )}
      </div>

      <CropAvatarDialog
        isOpen={cropDialogOpen}
        onClose={() => {
          setCropDialogOpen(false);
          setImageToCrop(null);
        }}
        imageSrc={imageToCrop}
        onCropComplete={handleCropComplete}
        aspect={1}
        circularCrop
      />
    </>
  );
}
