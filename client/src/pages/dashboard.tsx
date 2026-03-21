import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Users, AlertTriangle, CalendarClock, Phone, Mail, MessageSquare, Video } from "lucide-react";
import { type Contact, INTERACTION_TYPES } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { format, isAfter, isBefore, startOfDay, addDays } from "date-fns";
import { th } from "date-fns/locale";

// Dashboard page — overview of CRM data
export default function Dashboard() {
  const { data: contacts, isLoading: contactsLoading } = useQuery<Contact[]>({
    queryKey: ["/api/contacts"],
  });

  const { data: stats, isLoading: statsLoading } = useQuery<{
    total: number;
    overdue: number;
    upcoming: number;
    byTag: Record<string, number>;
  }>({
    queryKey: ["/api/stats"],
  });

  // Use YYYY-MM-DD string comparison to avoid timezone issues
  const todayStr = new Date().toISOString().split("T")[0];
  const weekEndDate = addDays(new Date(), 7);
  const weekEndStr = weekEndDate.toISOString().split("T")[0];

  // Get overdue contacts (follow-up date is before today)
  const overdueContacts = contacts?.filter(
    (c) => c.nextFollowUp && c.nextFollowUp < todayStr
  ) || [];

  // Get upcoming this week (follow-up date is today or later, but within 7 days)
  const upcomingContacts = contacts?.filter(
    (c) =>
      c.nextFollowUp &&
      c.nextFollowUp >= todayStr &&
      c.nextFollowUp <= weekEndStr
  ) || [];

  const isLoading = contactsLoading || statsLoading;

  return (
    <div className="p-4 md:p-6 space-y-6 overflow-auto h-full">
      <div>
        <h1 className="text-xl font-semibold" data-testid="text-dashboard-title">แดชบอร์ด</h1>
        <p className="text-sm text-muted-foreground mt-1">ภาพรวมรายชื่อติดต่อและการติดตามของคุณ</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card data-testid="card-total-contacts">
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">รายชื่อทั้งหมด</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold tabular-nums" data-testid="text-total-count">
                {stats?.total ?? 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-overdue">
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">เกินกำหนด</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold tabular-nums text-destructive" data-testid="text-overdue-count">
                {stats?.overdue ?? 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-upcoming">
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">ติดตามสัปดาห์นี้</CardTitle>
            <CalendarClock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold tabular-nums text-primary" data-testid="text-upcoming-count">
                {stats?.upcoming ?? 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-tags">
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">แท็ก</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {stats?.byTag && Object.entries(stats.byTag).map(([tag, count]) => (
                  <Badge key={tag} variant="secondary" className="text-xs" data-testid={`badge-tag-${tag}`}>
                    {tag} {count}
                  </Badge>
                ))}
                {(!stats?.byTag || Object.keys(stats.byTag).length === 0) && (
                  <span className="text-sm text-muted-foreground">ยังไม่มีแท็ก</span>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Overdue follow-ups */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          เกินกำหนดติดตาม
        </h2>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : overdueContacts.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <CalendarClock className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
              <p className="text-sm">ไม่มีรายชื่อที่เกินกำหนดติดตาม</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {overdueContacts.map((contact) => (
              <ContactRow key={contact.id} contact={contact} variant="overdue" />
            ))}
          </div>
        )}
      </div>

      {/* Upcoming this week */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-primary" />
          ติดตามสัปดาห์นี้
        </h2>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : upcomingContacts.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <CalendarClock className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
              <p className="text-sm">ไม่มีนัดติดตามสัปดาห์นี้</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {upcomingContacts.map((contact) => (
              <ContactRow key={contact.id} contact={contact} variant="upcoming" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Single contact row for dashboard lists
function ContactRow({ contact, variant }: { contact: Contact; variant: "overdue" | "upcoming" }) {
  const tags: string[] = (() => {
    try {
      return JSON.parse(contact.tags);
    } catch {
      return [];
    }
  })();

  return (
    <Link href={`/contacts/${contact.id}`}>
      <Card
        className="cursor-pointer hover-elevate active-elevate-2 transition-colors"
        data-testid={`card-contact-${contact.id}`}
      >
        <CardContent className="py-3 px-4 flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm truncate">{contact.name}</span>
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs shrink-0">
                  {tag}
                </Badge>
              ))}
            </div>
            {(contact.company || contact.role) && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {[contact.role, contact.company].filter(Boolean).join(" @ ")}
              </p>
            )}
          </div>
          <div className="text-right shrink-0">
            {contact.nextFollowUp && (
              <span
                className={`text-xs tabular-nums ${
                  variant === "overdue" ? "text-destructive font-medium" : "text-primary"
                }`}
              >
                {format(new Date(contact.nextFollowUp), "d MMM yyyy", { locale: th })}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
