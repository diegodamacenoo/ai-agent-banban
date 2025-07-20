'use client';

import React, { useRef } from 'react';
import { 
  Cropper, 
  CircleStencil,
  RectangleStencil,
  CropperRef
} from 'react-advanced-cropper';
import 'react-advanced-cropper/dist/style.css';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { useToast } from '@/shared/ui/toast';

interface CropAvatarDialogProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string | null;
  onCropComplete: (croppedImageBlob: Blob | null) => void;
  aspect?: number;
  circularCrop?: boolean;
}

export function CropAvatarDialog({
  isOpen,
  onClose,
  imageSrc,
  onCropComplete,
  aspect = 1,
  circularCrop = true,
}: CropAvatarDialogProps) {
  const cropperRef = useRef<CropperRef>(null);
  const { toast } = useToast();

  const handleCropImage = () => {
    if (!cropperRef.current) {
      toast.error("NÃ£o foi possÃ­vel recortar a imagem.", {
        title: "Erro",
      });
      return;
    }

    const canvas = cropperRef.current.getCanvas();
    if (canvas) {
      // Gerar blob PNG da imagem recortada com qualidade 0.9
      canvas.toBlob((blob) => {
        if (blob) {
          onCropComplete(blob);
          onClose();
        } else {
          toast.error("Falha ao criar blob da imagem recortada.", {
            title: "Erro",
          });
        }
      }, 'image/png', 0.9);
    } else {
      toast.error("NÃ£o foi possÃ­vel obter o canvas do cropper.", {
        title: "Erro",
      });
    }
  };

  const handleClose = () => {
    onClose();
  };

  if (!isOpen || !imageSrc) {
    return null;
  }

  // Escolha o stencil baseado na prop circularCrop
  const StencilComponent = circularCrop ? CircleStencil : RectangleStencil;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[500px] min-h-[550px] flex flex-col">
        <DialogHeader>
          <DialogTitle>Recortar Imagem do Avatar</DialogTitle>
        </DialogHeader>
        <div className="flex-grow flex items-center justify-center p-4">
          <div className="w-full h-[350px] sm:h-[400px] relative">
            <Cropper
              ref={cropperRef}
              src={imageSrc}
              stencilComponent={StencilComponent}
              stencilProps={{
                aspectRatio: aspect,
                movable: true,
                resizable: true,
                lines: true,
                handlers: {
                  eastNorth: true,
                  north: true,
                  westNorth: true,
                  west: true,
                  westSouth: true,
                  south: true,
                  eastSouth: true,
                  east: true,
                },
              }}
              className="h-full w-full"
            />
          </div>
        </div>
        <DialogFooter className="mt-auto pt-4">
          <DialogClose asChild>
            <Button variant="outline" onClick={handleClose}>Cancelar</Button>
          </DialogClose>
          <Button onClick={handleCropImage}>
            Aplicar Recorte
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 
