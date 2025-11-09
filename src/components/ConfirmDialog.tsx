"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ReactNode } from "react";

export default function ConfirmDialog({
  onConfirm,
  children,
  title,
  description,
  confirmText,
}: {
  onConfirm: () => void;
  children: ReactNode;
  title: string;
  description: string;
  confirmText: string;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent className="bg-white p-0 border-0">
        <AlertDialogTitle className="bg-admin-btn text-center py-3 rounded-t-lg text-xl">
          {title}
        </AlertDialogTitle>
        <div className="px-5 pb-4">
          <AlertDialogHeader>
            <AlertDialogDescription className="text-xl">
              {description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-10">
            <AlertDialogCancel className="bg-admin-btn hover:bg-admin-btn/50 hover:cursor-pointer">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={onConfirm}
              className="bg-admin-btn hover:bg-admin-btn/50 hover:cursor-pointer"
            >
              {confirmText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
