import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, LayoutGrid, List as ListIcon, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type ViewType = "list" | "kanban" | "form";

interface PaginationProps {
  page: number;
  totalPages: number;
  setPage: (p: number) => void;
}

interface MasterDataLayoutProps {
  title: string;
  subtitle: string;
  view: ViewType;
  setView: (view: ViewType) => void;
  onNew: () => void;
  onBack: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  renderList: () => React.ReactNode;
  renderKanban: () => React.ReactNode;
  renderForm: () => React.ReactNode;
  hideNewButton?: boolean;
  pagination?: PaginationProps;
}

export function MasterDataLayout({
  title, subtitle, view, setView, onNew, onBack, searchQuery, setSearchQuery, renderList, renderKanban, renderForm, hideNewButton, pagination
}: MasterDataLayoutProps) {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {view !== "form" && (
        <div className="flex justify-between items-center bg-white/60 backdrop-blur-xl p-4 md:p-6 rounded-2xl shadow-sm border border-white/60 ring-1 ring-black/5">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{title}</h1>
            <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
          </div>
          <div className="flex items-center space-x-4">
            <Input 
              placeholder="Search..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="w-64 bg-white/80 border-slate-200/60 focus-visible:ring-uf-green/30 rounded-xl"
            />
            <div className="flex rounded-xl overflow-hidden shadow-sm ring-1 ring-slate-200/60">
              <Button 
                variant={view === "list" ? "default" : "outline"} 
                className={cn("rounded-none px-4 h-10 border-0", view === "list" ? "bg-uf-green hover:bg-uf-green/90" : "bg-white/80 hover:bg-white")}
                onClick={() => setView("list")}
              >
                <ListIcon className="h-4 w-4" />
              </Button>
              <Button 
                variant={view === "kanban" ? "default" : "outline"} 
                className={cn("rounded-none px-4 h-10 border-0 border-l border-slate-200/60", view === "kanban" ? "bg-uf-green hover:bg-uf-green/90" : "bg-white/80 hover:bg-white")}
                onClick={() => setView("kanban")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
            {!hideNewButton && (
              <Button onClick={onNew} className="bg-uf-green hover:bg-uf-green/90 shadow-sm">
                <Plus className="mr-2 h-4 w-4" /> New
              </Button>
            )}
          </div>
        </div>
      )}

      {view === "form" && (
        <div className="flex items-center space-x-4 mb-2">
          <Button variant="ghost" onClick={onBack} className="text-slate-500 hover:text-slate-900 hover:bg-white/50">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to {title}
          </Button>
        </div>
      )}

      <div className="mt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {view === "list" && renderList()}
        {view === "kanban" && renderKanban()}
        {view === "form" && renderForm()}
      </div>

      {view !== "form" && pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between bg-white/60 backdrop-blur-xl p-4 md:px-6 rounded-2xl border border-white/60 ring-1 ring-black/5 shadow-sm mt-6">
          <div className="text-sm font-medium text-slate-500">
            Page {pagination.page} of {pagination.totalPages}
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-white/80 border-slate-200/60 hover:bg-white"
              disabled={pagination.page <= 1}
              onClick={() => pagination.setPage(pagination.page - 1)}
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Prev
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-white/80 border-slate-200/60 hover:bg-white"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => pagination.setPage(pagination.page + 1)}
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
