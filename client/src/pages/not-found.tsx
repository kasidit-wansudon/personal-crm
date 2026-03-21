import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

// 404 page
export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      <h1 className="text-xl font-semibold mb-2">ไม่พบหน้านี้</h1>
      <p className="text-sm text-muted-foreground mb-4">หน้าที่คุณต้องการไม่มีอยู่ในระบบ</p>
      <Link href="/">
        <Button variant="secondary" data-testid="button-go-home">
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          กลับหน้าแดชบอร์ด
        </Button>
      </Link>
    </div>
  );
}
