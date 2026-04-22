import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Save, FolderOpen, Trash2, FilePlus2, Pencil } from "lucide-react";
import { type PayrollConfig } from "@/lib/payroll";
import {
  type ConfigProfile, makeId,
} from "@/lib/profiles";

interface Props {
  profiles: ConfigProfile[];
  setProfiles: (list: ConfigProfile[]) => void;
  activeId: string | null;
  setActiveId: (id: string | null) => void;
  config: PayrollConfig;
  setConfig: (c: PayrollConfig) => void;
}

export function ProfileBar({ profiles, setProfiles, activeId, setActiveId, config, setConfig }: Props) {
  const [newName, setNewName] = useState("");
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const active = profiles.find((p) => p.id === activeId) ?? null;

  const handleSelect = (id: string) => {
    const p = profiles.find((x) => x.id === id);
    if (!p) return;
    setActiveId(id);
    setConfig(p.config);
    toast.success(`Đã tải profile "${p.name}"`);
  };

  const handleSaveCurrent = () => {
    if (!active) {
      toast.error("Chưa chọn profile để lưu — hãy tạo mới hoặc đặt làm mặc định.");
      return;
    }
    const next = profiles.map((p) =>
      p.id === active.id ? { ...p, config, updatedAt: Date.now() } : p,
    );
    setProfiles(next);
    toast.success(`Đã cập nhật "${active.name}"`);
  };

  const handleCreate = () => {
    const name = newName.trim();
    if (!name) {
      toast.error("Nhập tên profile");
      return;
    }
    const id = makeId();
    const profile: ConfigProfile = { id, name, config, updatedAt: Date.now() };
    const next = [...profiles, profile].sort((a, b) => a.name.localeCompare(b.name, "vi"));
    setProfiles(next);
    setActiveId(id);
    setNewName("");
    setCreateOpen(false);
    toast.success(`Đã tạo profile "${name}"`);
  };

  const handleRename = () => {
    if (!active) return;
    const name = renameValue.trim();
    if (!name) return;
    const next = profiles.map((p) => (p.id === active.id ? { ...p, name } : p));
    setProfiles(next);
    setRenameOpen(false);
    toast.success(`Đã đổi tên thành "${name}"`);
  };

  const handleDelete = () => {
    if (!active) return;
    const next = profiles.filter((p) => p.id !== active.id);
    setProfiles(next);
    setActiveId(next[0]?.id ?? null);
    if (next[0]) setConfig(next[0].config);
    toast.success(`Đã xoá "${active.name}"`);
  };

  return (
    <Card className="p-3 md:p-4 shadow-soft border-border/60 mb-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 mr-2">
          <FolderOpen className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold whitespace-nowrap">Profile cấu hình</span>
        </div>

        <Select value={activeId ?? undefined} onValueChange={handleSelect}>
          <SelectTrigger className="h-9 w-[220px]">
            <SelectValue placeholder={profiles.length ? "Chọn profile…" : "Chưa có profile"} />
          </SelectTrigger>
          <SelectContent>
            {profiles.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button size="sm" variant="outline" onClick={handleSaveCurrent} disabled={!active}>
          <Save className="h-3.5 w-3.5 mr-1" />Lưu thay đổi
        </Button>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <FilePlus2 className="h-3.5 w-3.5 mr-1" />Tạo profile mới
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tạo profile cấu hình</DialogTitle>
              <DialogDescription>
                Profile mới sẽ chứa toàn bộ công thức hiện tại. Có thể đặt tên theo công ty / vùng / năm.
              </DialogDescription>
            </DialogHeader>
            <Input
              placeholder="VD: TP.HCM 2024, HN test, Cty A…"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Huỷ</Button>
              <Button onClick={handleCreate}>Tạo</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={renameOpen} onOpenChange={(o) => { setRenameOpen(o); if (o && active) setRenameValue(active.name); }}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" disabled={!active}>
              <Pencil className="h-3.5 w-3.5 mr-1" />Đổi tên
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Đổi tên profile</DialogTitle>
            </DialogHeader>
            <Input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRename()}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setRenameOpen(false)}>Huỷ</Button>
              <Button onClick={handleRename}>Lưu</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" variant="outline" disabled={!active}>
              <Trash2 className="h-3.5 w-3.5 mr-1" />Xoá
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xoá profile "{active?.name}"?</AlertDialogTitle>
              <AlertDialogDescription>
                Profile và toàn bộ cấu hình kèm theo sẽ bị xoá khỏi trình duyệt. Hành động này không thể hoàn tác.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Huỷ</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Xoá</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <span className="text-[11px] text-muted-foreground ml-auto">
          {active ? `Đang dùng: ${active.name} • tự động lưu lựa chọn` : "Chưa chọn profile — thay đổi không được lưu"}
        </span>
      </div>
    </Card>
  );
}
