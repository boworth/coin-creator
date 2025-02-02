import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import ReactCrop, { Crop } from 'react-image-crop'
import { useRef, useState } from "react"
import 'react-image-crop/dist/ReactCrop.css'

interface ImageCropModalProps {
  isOpen: boolean
  onClose: () => void
  imageUrl: string
  onCropComplete: (croppedFile: File) => void
  form: any
}

export default function ImageCropModal({ 
  isOpen, 
  onClose, 
  imageUrl, 
  onCropComplete,
  form 
}: ImageCropModalProps) {
  const imgRef = useRef<HTMLImageElement>(null)
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 0,
    height: 0,
    x: 0,
    y: 0
  })

  // Calculate crop area when image loads
  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget
    const shorterEdge = Math.min(width, height)
    const percentWidth = (shorterEdge / width) * 100
    const percentHeight = (shorterEdge / height) * 100
    const x = (100 - percentWidth) / 2
    const y = (100 - percentHeight) / 2

    setCrop({
      unit: '%',
      width: percentWidth,
      height: percentHeight,
      x,
      y
    })
  }

  const handleClose = () => {
    form.setValue('logo', undefined)
    onClose()
  }

  const onCrop = async () => {
    if (!imgRef.current) return
    
    const canvas = document.createElement('canvas')
    const scaleX = imgRef.current.naturalWidth / imgRef.current.width
    const scaleY = imgRef.current.naturalHeight / imgRef.current.height
    
    canvas.width = 800
    canvas.height = 800
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    ctx.drawImage(
      imgRef.current,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      800,
      800
    )
    
    canvas.toBlob(
      (blob) => {
        if (!blob) return
        const file = new File([blob], 'token-logo.png', { 
          type: 'image/png',
          lastModified: Date.now()
        })
        onCropComplete(file)
      },
      'image/png',
      0.9
    )
  }

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        if (!open) handleClose()
      }}
    >
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Crop Logo Image</DialogTitle>
          <DialogDescription>
            Your image will be cropped to a square format
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 relative">
          <ReactCrop
            crop={crop}
            onChange={setCrop}
            aspect={1}
            circularCrop
          >
            <img 
              ref={imgRef} 
              src={imageUrl} 
              alt="Crop preview"
              style={{ maxWidth: '100%' }}
              onLoad={onImageLoad}
            />
          </ReactCrop>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button onClick={onCrop}>Apply Crop</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 