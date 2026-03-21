import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useLocation } from "wouter";
import {
  ArrowLeft,
  Phone,
  Mail,
  Building2,
  Briefcase,
  Calendar,
  MessageSquare,
  Video,
  Edit,
  Trash2,
  Plus,
  PhoneCall,
  MailCheck,
  Users,
} from "lucide-react";
import { Link } from "wouter";
import {
  type Contact,
  type Interaction,
  TAG_OPTIONS,
  INTERACTION_TYPES,
} from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { th } from "date-fns/locale";

// Interaction type icon mapping
const interactionIcons: Record<string, React.ReactNode> = {
  call: <PhoneCall className="h-3.5 w-3.5" />,
  message: <MessageSquare className="h-3.5 w-3.5" />,
  meeting: <Users className="h-3.5 w-3.5" />,
  email: <MailCheck className="h-3.5 w-3.5" />,
};

// Contact detail page — profile, interactions, edit, follow-up
export default function ContactDetail({ params }: { params: { id: string } }) {
  const contactId = parseInt(params.id);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [interactionDialogOpen, setInteractionDialogOpen] = useState(false);

  const { data: contact, isLoading: contactLoading } = useQuery<Contact>({
    queryKey: ["/api/contacts", contactId],
  });

  const { data: interactions, isLoading: interactionsLoading } = useQuery<Interaction[]>({
    queryKey: ["/api/contacts", contactId, "interactions"],
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/contacts/${contactId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "ลบรายชื่อสำเร็จ" });
      navigate("/contacts");
    },
  });

  if (contactLoading) {
    return (
      <div className="p-4 md:p-6 space-y-4 overflow-auto h-full">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="p-4 md:p-6 overflow-auto h-full">
        <p className="text-muted-foreground">ไม่พบรายชื่อนี้</p>
        <Link href="/contacts">
          <Button variant="secondary" className="mt-3">
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            กลับ
          </Button>
        </Link>
      </div>
    );
  }

  const tags: string[] = (() => {
    try { return JSON.parse(contact.tags); }
    catch { return []; }
  })();

  return (
    <div className="p-4 md:p-6 space-y-5 overflow-auto h-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/contacts">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-semibold" data-testid="text-contact-name">{contact.name}</h1>
            {(contact.company || contact.role) && (
              <p className="text-sm text-muted-foreground">
                {[contact.role, contact.company].filter(Boolean).join(" @ ")}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="secondary" size="sm" data-testid="button-edit-contact">
                <Edit className="h-3.5 w-3.5 mr-1" />
                แก้ไข
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>แก้ไขข้อมูล</DialogTitle>
              </DialogHeader>
              <EditContactForm
                contact={contact}
                onSuccess={() => setEditDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" data-testid="button-delete-contact">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
                <AlertDialogDescription>
                  ต้องการลบ "{contact.name}" หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteMutation.mutate()}
                  className="bg-destructive text-destructive-foreground"
                  data-testid="button-confirm-delete"
                >
                  ลบ
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Contact info cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Basic info */}
        <Card data-testid="card-contact-info">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">ข้อมูลติดต่อ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {contact.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span data-testid="text-phone">{contact.phone}</span>
              </div>
            )}
            {contact.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span data-testid="text-email">{contact.email}</span>
              </div>
            )}
            {contact.company && (
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span data-testid="text-company">{contact.company}</span>
              </div>
            )}
            {contact.role && (
              <div className="flex items-center gap-2 text-sm">
                <Briefcase className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span data-testid="text-role">{contact.role}</span>
              </div>
            )}
            {tags.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
            {!contact.phone && !contact.email && !contact.company && !contact.role && tags.length === 0 && (
              <p className="text-sm text-muted-foreground">ยังไม่มีข้อมูลติดต่อ</p>
            )}
          </CardContent>
        </Card>

        {/* Follow-up & dates */}
        <Card data-testid="card-followup-info">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">การติดตาม</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">ติดต่อล่าสุด</span>
              <span className="tabular-nums" data-testid="text-last-contact">
                {contact.lastContactDate
                  ? format(new Date(contact.lastContactDate), "d MMM yyyy", { locale: th })
                  : "ยังไม่ระบุ"}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">นัดติดตามถัดไป</span>
              <span
                className={`tabular-nums ${
                  contact.nextFollowUp && new Date(contact.nextFollowUp) < new Date()
                    ? "text-destructive font-medium"
                    : ""
                }`}
                data-testid="text-next-followup"
              >
                {contact.nextFollowUp
                  ? format(new Date(contact.nextFollowUp), "d MMM yyyy", { locale: th })
                  : "ยังไม่ระบุ"}
              </span>
            </div>
            {contact.notes && (
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground mb-1">หมายเหตุ</p>
                <p className="text-sm whitespace-pre-wrap" data-testid="text-notes">{contact.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Interaction log */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold">บันทึกการติดต่อ</h2>
          <Dialog open={interactionDialogOpen} onOpenChange={setInteractionDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" data-testid="button-add-interaction">
                <Plus className="h-3.5 w-3.5 mr-1" />
                บันทึกใหม่
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>บันทึกการติดต่อ</DialogTitle>
              </DialogHeader>
              <AddInteractionForm
                contactId={contactId}
                onSuccess={() => setInteractionDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>

        {interactionsLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : !interactions || interactions.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">ยังไม่มีบันทึกการติดต่อ</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-1.5">
            {interactions.map((interaction) => (
              <Card key={interaction.id} data-testid={`card-interaction-${interaction.id}`}>
                <CardContent className="py-2.5 px-4 flex items-start gap-3">
                  <div className="mt-0.5 text-primary">
                    {interactionIcons[interaction.type] || <MessageSquare className="h-3.5 w-3.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {INTERACTION_TYPES[interaction.type as keyof typeof INTERACTION_TYPES] || interaction.type}
                      </span>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {format(new Date(interaction.date), "d MMM yyyy", { locale: th })}
                      </span>
                    </div>
                    {interaction.notes && (
                      <p className="text-xs text-muted-foreground mt-0.5 whitespace-pre-wrap">
                        {interaction.notes}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Edit contact form
function EditContactForm({
  contact,
  onSuccess,
}: {
  contact: Contact;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const initialTags: string[] = (() => {
    try { return JSON.parse(contact.tags); }
    catch { return []; }
  })();

  const [name, setName] = useState(contact.name);
  const [company, setCompany] = useState(contact.company || "");
  const [role, setRole] = useState(contact.role || "");
  const [phone, setPhone] = useState(contact.phone || "");
  const [email, setEmail] = useState(contact.email || "");
  const [notes, setNotes] = useState(contact.notes || "");
  const [selectedTags, setSelectedTags] = useState<string[]>(initialTags);
  const [nextFollowUp, setNextFollowUp] = useState(contact.nextFollowUp || "");
  const [lastContactDate, setLastContactDate] = useState(contact.lastContactDate || "");

  const updateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", `/api/contacts/${contact.id}`, {
        name,
        company: company || null,
        role: role || null,
        phone: phone || null,
        email: email || null,
        notes: notes || null,
        tags: selectedTags,
        nextFollowUp: nextFollowUp || null,
        lastContactDate: lastContactDate || null,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "บันทึกสำเร็จ" });
      onSuccess();
    },
    onError: (err: Error) => {
      toast({ title: "เกิดข้อผิดพลาด", description: err.message, variant: "destructive" });
    },
  });

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        updateMutation.mutate();
      }}
      className="space-y-3"
    >
      <div className="space-y-1.5">
        <Label htmlFor="edit-name">ชื่อ *</Label>
        <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} required data-testid="input-edit-name" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="edit-company">บริษัท</Label>
          <Input id="edit-company" value={company} onChange={(e) => setCompany(e.target.value)} data-testid="input-edit-company" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="edit-role">ตำแหน่ง</Label>
          <Input id="edit-role" value={role} onChange={(e) => setRole(e.target.value)} data-testid="input-edit-role" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="edit-phone">โทรศัพท์</Label>
          <Input id="edit-phone" value={phone} onChange={(e) => setPhone(e.target.value)} data-testid="input-edit-phone" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="edit-email">อีเมล</Label>
          <Input id="edit-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} data-testid="input-edit-email" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>แท็ก</Label>
        <div className="flex flex-wrap gap-1.5">
          {TAG_OPTIONS.map((tag) => (
            <Badge
              key={tag}
              variant={selectedTags.includes(tag) ? "default" : "secondary"}
              className="cursor-pointer"
              onClick={() => toggleTag(tag)}
              data-testid={`tag-edit-${tag}`}
            >
              {tag}
            </Badge>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="edit-lastContact">ติดต่อล่าสุด</Label>
          <Input
            id="edit-lastContact"
            type="date"
            value={lastContactDate}
            onChange={(e) => setLastContactDate(e.target.value)}
            data-testid="input-edit-last-contact"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="edit-nextFollowUp">นัดติดตามถัดไป</Label>
          <Input
            id="edit-nextFollowUp"
            type="date"
            value={nextFollowUp}
            onChange={(e) => setNextFollowUp(e.target.value)}
            data-testid="input-edit-next-followup"
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="edit-notes">หมายเหตุ</Label>
        <Textarea
          id="edit-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="resize-none"
          rows={3}
          data-testid="input-edit-notes"
        />
      </div>
      <Button type="submit" className="w-full" disabled={updateMutation.isPending || !name.trim()} data-testid="button-save-edit">
        {updateMutation.isPending ? "กำลังบันทึก..." : "บันทึก"}
      </Button>
    </form>
  );
}

// Add interaction form
function AddInteractionForm({
  contactId,
  onSuccess,
}: {
  contactId: number;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [type, setType] = useState<string>("call");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/contacts/${contactId}/interactions`, {
        contactId,
        type,
        date,
        notes: notes || null,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts", contactId, "interactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contacts", contactId] });
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "บันทึกการติดต่อสำเร็จ" });
      onSuccess();
    },
    onError: (err: Error) => {
      toast({ title: "เกิดข้อผิดพลาด", description: err.message, variant: "destructive" });
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        createMutation.mutate();
      }}
      className="space-y-3"
    >
      <div className="space-y-1.5">
        <Label htmlFor="interaction-type">ประเภท</Label>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger data-testid="select-interaction-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(INTERACTION_TYPES).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="interaction-date">วันที่</Label>
        <Input
          id="interaction-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          data-testid="input-interaction-date"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="interaction-notes">หมายเหตุ</Label>
        <Textarea
          id="interaction-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="รายละเอียดการติดต่อ..."
          className="resize-none"
          rows={2}
          data-testid="input-interaction-notes"
        />
      </div>
      <Button
        type="submit"
        className="w-full"
        disabled={createMutation.isPending}
        data-testid="button-submit-interaction"
      >
        {createMutation.isPending ? "กำลังบันทึก..." : "บันทึก"}
      </Button>
    </form>
  );
}
