import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { QrCode, Share2, Link as LinkIcon, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { SiteInfo } from "@shared/schema";

interface HeaderProps {
  siteInfo?: SiteInfo;
}

export default function Header({ siteInfo }: HeaderProps) {
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const { toast } = useToast();

  const siteTitle = siteInfo?.siteTitle || "Tours d'Eau Mayotte";
  const qrPromptText = siteInfo?.qrPromptText || "";
  const whatsappMessage = siteInfo?.whatsappMessage || "Consultez les horaires des tours d'eau à Mayotte ici : ";
  const currentUrl = window.location.href;

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(qrPromptText);
    toast({ title: "Prompt copié !" });
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    toast({ title: "Lien copié !" });
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(`${whatsappMessage}${currentUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleNativeShare = async () => {
    const shareData = {
      title: siteTitle,
      text: whatsappMessage,
      url: currentUrl,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        toast({ title: "Partage réussi !" });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          toast({ 
            title: "Erreur de partage", 
            description: "Impossible d'utiliser le partage natif.",
            variant: "destructive" 
          });
        }
      }
    } else {
      setIsShareOpen(true);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-background border-b border-border">
      <div className="max-w-4xl mx-auto px-4 h-16 md:h-18 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl" role="img" aria-label="water droplet">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-primary">
              <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
            </svg>
          </span>
          <h1 className="text-xl md:text-2xl font-bold text-foreground" data-testid="text-site-title">
            {siteTitle}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="flex-shrink-0"
            onClick={handleNativeShare}
            data-testid="button-native-share"
            aria-label="Partager le site"
          >
            <Share2 className="w-5 h-5" />
          </Button>

          <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-center">Partager ce site</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col items-center gap-6 py-4">
                <div className="bg-white p-4 rounded-md border border-border">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(currentUrl)}`}
                    alt="QR Code du site"
                    className="w-48 h-48"
                    data-testid="img-share-qr-code"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4 w-full">
                  <Button 
                    variant="outline" 
                    className="gap-2" 
                    onClick={handleWhatsAppShare}
                    data-testid="button-share-whatsapp"
                  >
                    <MessageCircle className="w-4 h-4 text-green-500" />
                    WhatsApp
                  </Button>
                  <Button 
                    variant="outline" 
                    className="gap-2" 
                    onClick={handleCopyLink}
                    data-testid="button-copy-link"
                  >
                    <LinkIcon className="w-4 h-4" />
                    Copier le lien
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {qrPromptText && (
            <Dialog open={isQrOpen} onOpenChange={setIsQrOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="flex-shrink-0"
                  data-testid="button-qr-code"
                  aria-label="Afficher le QR code IA"
                >
                  <QrCode className="w-5 h-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-center">Vérifier les horaires avec l'IA</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center gap-4 py-4">
                  <div className="bg-white p-4 rounded-md border border-border">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrPromptText)}`}
                      alt="QR Code IA Prompt"
                      className="w-48 h-48"
                      data-testid="img-qr-code"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground text-center max-w-xs">
                    Scannez ce QR code pour demander à un assistant IA les horaires actuels
                  </p>
                  <div className="w-full bg-muted rounded-md p-3">
                    <p className="text-xs text-muted-foreground mb-2 font-medium">Prompt à copier :</p>
                    <p className="text-sm text-foreground whitespace-pre-line">{qrPromptText}</p>
                  </div>
                  <Button onClick={handleCopyPrompt} className="w-full" data-testid="button-copy-prompt">
                    Copier le prompt
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </header>
  );
}
