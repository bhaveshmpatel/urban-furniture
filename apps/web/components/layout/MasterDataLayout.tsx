import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, LayoutGrid, List as ListIcon, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";

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
    <div className="space-y-6">
      {view !== "form" && (
        <div className="flex justify-between items-center bg-white p-4 rounded-md shadow-sm border border-uf-border">
          <div>
            <h1 className="text-2xl font-bold text-uf-text-main">{title}</h1>
            <p className="text-sm text-uf-muted">{subtitle}</p>
          </div>
          <div className="flex items-center space-x-4">
            <Input 
              placeholder="Search..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="w-64"
            />
            <div className="flex rounded-md overflow-hidden">
              <Button 
                variant={view === "list" ? "default" : "outline"} 
                className="rounded-none px-3"
                onClick={() => setView("list")}
              >
                <ListIcon className="h-4 w-4" />
              </Button>
              <Button 
                variant={view === "kanban" ? "default" : "outline"} 
                className="rounded-none px-3 border-l-0"
                onClick={() => setView("kanban")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
            {!hideNewButton && (
              <Button onClick={onNew}>
                <Plus className="mr-2 h-4 w-4" /> New
              </Button>
            )}
          </div>
        </div>
      )}

      {view === "form" && (
        <div className="flex items-center space-x-4 mb-4">
          <Button variant="ghost" onClick={onBack} className="text-uf-muted hover:text-uf-text-main">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to {title}
          </Button>
        </div>
      )}

      <div className="mt-4">
        {view === "list" && renderList()}
        {view === "kanban" && renderKanban()}
        {view === "form" && renderForm()}
      </div>

      {view !== "form" && pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between bg-white p-4 rounded-md border shadow-sm mt-4">
          <div className="text-sm text-gray-500">
            Page {pagination.page} of {pagination.totalPages}
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              disabled={pagination.page <= 1}
              onClick={() => pagination.setPage(pagination.page - 1)}
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Prev
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
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
