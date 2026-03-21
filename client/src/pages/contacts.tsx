import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "wouter";
import { Plus, Search, Phone, Mail, Users, SortAsc } from "lucide-react";
import { type Contact, TAG_OPTIONS } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { th } from "date-fns/locale";

// Contacts list page — browse, search, filter contacts
export default function ContactsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTag, setFilterTag] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"name" | "lastContact">("name");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: contacts, isLoading } = useQuery<Contact[]>({
    queryKey: ["/api/contacts"],
  });

  // Filter and sort contacts
  const filteredContacts = (contacts || [])
    .filter((c) => {
      // Search filter
      const matchesSearch =
        !searchQuery ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchQuery.toLowerCase());

      // Tag filter
      const tags: string[] = (() => {
        try { return JSON.parse(c.tags); }
        catch { return []; }
      })();
      const matchesTag = filterTag === "all" || tags.includes(filterTag);

      return matchesSearch && matchesTag;
    })
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      // Sort by last contact date (most recent first, nulls last)
      const dateA = a.lastContactDate ? new Date(a.lastContactDate).getTime() : 0;
      const dateB = b.lastContactDate ? new Date(b.lastContactDate).getTime() : 0;
      return dateB - dateA;
    });

  return (
    <div className="p-4 md:p-6 space-y-4 overflow-auto h-full">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold" data-testid="text-contacts-title">รายชื่อติดต่อ</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {contacts ? `${contacts.length} รายชื่อ` : "กำลังโหลด..."}
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-contact">
              <Plus className="h-4 w-4 mr-1.5" />
              เพิ่มรายชื่อ
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>เพิ่มรายชื่อใหม่</DialogTitle>
            </DialogHeader>
            <AddContactForm onSuccess={() => setDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ค้นหาชื่อ, บริษัท, อีเมล..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
            data-testid="input-search"
          />
        </div>
        <Select value={filterTag} onValueChange={setFilterTag}>
          <SelectTrigger className="w-[140px]" data-testid="select-filter-tag">
            <SelectValue placeholder="ทุกแท็ก" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกแท็ก</SelectItem>
            {TAG_OPTIONS.map((tag) => (
              <SelectItem key={tag} value={tag}>{tag}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as "name" | "lastContact")}>
          <SelectTrigger className="w-[160px]" data-testid="select-sort">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">เรียงตามชื่อ</SelectItem>
            <SelectItem value="lastContact">ติดต่อล่าสุด</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Contact list */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : filteredContacts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground mb-3">
              {searchQuery || filterTag !== "all"
                ? "ไม่พบรายชื่อที่ตรงกัน"
                : "ยังไม่มีรายชื่อติดต่อ"}
            </p>
            {!searchQuery && filterTag === "all" && (
              <Button variant="secondary" onClick={() => setDialogOpen(true)} data-testid="button-add-first-contact">
                <Plus className="h-4 w-4 mr-1.5" />
                เพิ่มรายชื่อแรก
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-1.5">
          {filteredContacts.map((contact) => (
            <ContactListItem key={contact.id} contact={contact} />
          ))}
        </div>
      )}
    </div>
  );
}

// Single contact row in the list
function ContactListItem({ contact }: { contact: Contact }) {
  const tags: string[] = (() => {
    try { return JSON.parse(contact.tags); }
    catch { return []; }
  })();

  return (
    <Link href={`/contacts/${contact.id}`}>
      <Card
        className="cursor-pointer hover-elevate active-elevate-2"
        data-testid={`card-contact-${contact.id}`}
      >
        <CardContent className="py-3 px-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm">{contact.name}</span>
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
              {(contact.company || contact.role) && (
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {[contact.role, contact.company].filter(Boolean).join(" @ ")}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {contact.phone && (
                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
              )}
              {contact.email && (
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
              )}
              <div className="text-right">
                {contact.lastContactDate ? (
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {format(new Date(contact.lastContactDate), "d MMM yy", { locale: th })}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">-</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// Add contact form
function AddContactForm({ onSuccess }: { onSuccess: () => void }) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [nextFollowUp, setNextFollowUp] = useState("");

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/contacts", {
        name,
        company: company || null,
        role: role || null,
        phone: phone || null,
        email: email || null,
        notes: notes || null,
        tags: selectedTags,
        lastContactDate: null,
        nextFollowUp: nextFollowUp || null,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "เพิ่มรายชื่อสำเร็จ" });
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
        createMutation.mutate();
      }}
      className="space-y-3"
    >
      <div className="space-y-1.5">
        <Label htmlFor="name">ชื่อ *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="ชื่อ-นามสกุล"
          required
          data-testid="input-name"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="company">บริษัท</Label>
          <Input
            id="company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="ชื่อบริษัท"
            data-testid="input-company"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="role">ตำแหน่ง</Label>
          <Input
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="ตำแหน่ง"
            data-testid="input-role"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="phone">โทรศัพท์</Label>
          <Input
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="เบอร์โทร"
            data-testid="input-phone"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">อีเมล</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="อีเมล"
            data-testid="input-email"
          />
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
              data-testid={`tag-${tag}`}
            >
              {tag}
            </Badge>
          ))}
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="nextFollowUp">นัดติดตามครั้งถัดไป</Label>
        <Input
          id="nextFollowUp"
          type="date"
          value={nextFollowUp}
          onChange={(e) => setNextFollowUp(e.target.value)}
          data-testid="input-next-followup"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="notes">หมายเหตุ</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="หมายเหตุเกี่ยวกับความสัมพันธ์..."
          className="resize-none"
          rows={2}
          data-testid="input-notes"
        />
      </div>
      <Button
        type="submit"
        className="w-full"
        disabled={createMutation.isPending || !name.trim()}
        data-testid="button-submit-contact"
      >
        {createMutation.isPending ? "กำลังบันทึก..." : "บันทึก"}
      </Button>
    </form>
  );
}
