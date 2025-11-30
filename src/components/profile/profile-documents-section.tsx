import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DocumentUpload } from "@/components/common/document-upload";
import { User as UserType } from "@/types";

interface ProfileDocumentsSectionProps {
  userId: string;
  user: UserType;
  isEditing: boolean;
  onDocumentUpload: (field: string, url: string) => void;
}

export function ProfileDocumentsSection({
  userId,
  user,
  isEditing,
  onDocumentUpload,
}: ProfileDocumentsSectionProps) {
  return (
    <Card className="bg-white rounded-[2rem] shadow-[0_12px_32px_-8px_hsl(215_60%_15%_/_0.4)] border-0">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          📎 Dokumente
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-6">
          <DocumentUpload
            userId={userId}
            documentType="bfa"
            label="Befähigungsnachweis (BFA Binnen)"
            currentUrl={(user as any).documentBfa}
            onUploadComplete={(url) => onDocumentUpload("documentBfa", url)}
            disabled={!isEditing}
          />

          <DocumentUpload
            userId={userId}
            documentType="insurance"
            label="Versicherung Nachweis"
            currentUrl={(user as any).documentInsurance}
            onUploadComplete={(url) => onDocumentUpload("documentInsurance", url)}
            disabled={!isEditing}
          />

          <DocumentUpload
            userId={userId}
            documentType="berth_contract"
            label="Liegeplatzvertrag"
            currentUrl={(user as any).documentBerthContract}
            onUploadComplete={(url) => onDocumentUpload("documentBerthContract", url)}
            disabled={!isEditing}
          />

          <DocumentUpload
            userId={userId}
            documentType="member_photo"
            label="Mitgliederfoto"
            currentUrl={(user as any).documentMemberPhoto}
            onUploadComplete={(url) => onDocumentUpload("documentMemberPhoto", url)}
            disabled={!isEditing}
          />
        </div>
      </CardContent>
    </Card>
  );
}
