import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";

interface GenericDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  isLoading?: boolean;
  className?: string;
}

export function GenericDialog({ 
  open, 
  onOpenChange, 
  title, 
  description, 
  children, 
  footer, 
  isLoading = false,
  className = "sm:max-w-[425px]"
}: GenericDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={className}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children}
        {footer}
      </DialogContent>
    </Dialog>
  );
}
