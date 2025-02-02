"use client"

import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

// Extend the Toast props type with our custom properties.
interface ExtendedToast extends Omit<React.ComponentProps<typeof Toast>, "id" | "type"> {
  id: string | number;
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {(toasts as ExtendedToast[]).map(function ({ id, title, description, action, ...props }: ExtendedToast) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
              {action}
            </div>
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
