import { useState, useEffect } from "react";
import { supabase } from "@gridix/utils/api";
import { Button } from "@gridix/ui";
import { Card, CardContent } from "@gridix/ui";
import { Input } from "@gridix/ui";
import { Label } from "@gridix/ui";
import { Textarea } from "@gridix/ui";
import { Switch } from "@gridix/ui";
import { Tabs, TabsList, TabsTrigger } from "@gridix/ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@gridix/ui";
import { Badge } from "@gridix/ui";
import {
  Loader2,
  Plus,
  Trash2,
  Save,
  Eye,
  Code,
  LayoutTemplate,
} from "lucide-react";
import { toast } from "sonner";

interface Template {
  id: number;
  key: string;
  channel: string;
  locale: string;
  subject_template: string;
  html_template: string;
  is_active: boolean;
  created_at: string;
}

export const EmailTemplatesManagement = () => {
  // const { supabase } = useSupabase(); // Use imported client directly
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  // Key-based selection instead of single template
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [activeLocale, setActiveLocale] = useState<string>("en");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"split" | "code" | "preview">(
    "split",
  );

  // New template form state
  const [newTemplateKey, setNewTemplateKey] = useState("");
  const [newTemplateSubject, setNewTemplateSubject] = useState("");
  const [newTemplateHtml, setNewTemplateHtml] = useState(
    "<html><body><h1>Hello!</h1></body></html>",
  );
  const [newTemplateLocale, setNewTemplateLocale] = useState("en");

  // Add Locale dialog state
  const [isAddLocaleDialogOpen, setIsAddLocaleDialogOpen] = useState(false);
  const [newLocale, setNewLocale] = useState("");

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("notification_templates")
        .select("*")
        .eq("channel", "email")
        .order("key", { ascending: true });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error("Error fetching templates:", error);
      toast.error("Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  // Group templates by key
  const uniqueKeys = Array.from(new Set(templates.map((t) => t.key)));

  // Get currently selected template based on key and active locale
  const currentTemplate = templates.find(
    (t) => t.key === selectedKey && t.locale === activeLocale,
  );

  // Get available locales for the selected key
  const availableLocalesForKey = templates
    .filter((t) => t.key === selectedKey)
    .map((t) => t.locale)
    .sort();

  const handleCreateTemplate = async () => {
    if (!newTemplateKey || !newTemplateSubject) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("notification_templates")
        .insert({
          key: newTemplateKey,
          channel: "email",
          subject_template: newTemplateSubject,
          html_template: newTemplateHtml,
          locale: newTemplateLocale,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      setTemplates([...templates, data]);
      setIsDialogOpen(false);
      setSelectedKey(data.key);
      setActiveLocale(data.locale);
      resetForm();
      toast.success("Template created successfully");
    } catch (error) {
      console.error("Error creating template:", error);
      toast.error("Failed to create template");
    }
  };

  const handleAddLocale = async () => {
    if (!selectedKey || !currentTemplate || !newLocale) return;

    if (availableLocalesForKey.includes(newLocale)) {
      toast.error("Locale already exists for this template");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("notification_templates")
        .insert({
          key: selectedKey,
          channel: "email",
          subject_template: currentTemplate.subject_template, // Duplicate from current
          html_template: currentTemplate.html_template, // Duplicate from current
          locale: newLocale,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      setTemplates([...templates, data]);
      setIsAddLocaleDialogOpen(false);
      setActiveLocale(newLocale);
      setNewLocale("");
      toast.success(`Locale ${newLocale} added successfully`);
    } catch (error) {
      console.error("Error adding locale:", error);
      toast.error("Failed to add locale");
    }
  };

  const handleUpdateTemplate = async () => {
    if (!currentTemplate) return;

    try {
      const { error } = await supabase
        .from("notification_templates")
        .update({
          subject_template: currentTemplate.subject_template,
          html_template: currentTemplate.html_template,
          is_active: currentTemplate.is_active,
        })
        .eq("id", currentTemplate.id);

      if (error) throw error;

      // Optimistic update already happened via state binding if we were editing state directly,
      // but here we need to update the templates array
      // Actually, we need to handle local state changes before saving?
      // Simplified: The input fields modify a local copy, or we update the array directly?
      // To keep it simple, let's say we update the array on save, but we need local state for editing...
      // Refactor: We update the specific template in the `templates` array on every change? No, that triggers re-renders.
      // Let's stick to update-on-change for inputs for now, or use a local edit state.
      // Given the complexity, let's assume `currentTemplate` is derived from state,
      // so we need a `handleTemplateChange` function to update the state array.

      toast.success("Template updated successfully");
    } catch (error) {
      console.error("Error updating template:", error);
      toast.error("Failed to update template");
    }
  };

  // Helper to update local state immediately (controlled inputs)
  const updateLocalTemplate = (updates: Partial<Template>) => {
    if (!currentTemplate) return;

    setTemplates(
      templates.map((t) =>
        t.id === currentTemplate.id ? { ...t, ...updates } : t,
      ),
    );
  };

  const handleDeleteTemplate = async (id: number) => {
    if (
      !confirm("Are you sure you want to delete this specific locale template?")
    )
      return;

    try {
      const { error } = await supabase
        .from("notification_templates")
        .delete()
        .eq("id", id);

      if (error) throw error;

      const remaining = templates.filter((t) => t.id !== id);
      setTemplates(remaining);

      // If we deleted the last locale for a key, selectedKey is still valid but no template will match.
      // If other locales exist, switch to one.
      const otherLocale = remaining.find((t) => t.key === selectedKey);
      if (otherLocale) {
        setActiveLocale(otherLocale.locale);
      } else {
        setSelectedKey(null);
      }

      toast.success("Template deleted successfully");
    } catch (error) {
      console.error("Error deleting template:", error);
      toast.error("Failed to delete template");
    }
  };

  const resetForm = () => {
    setNewTemplateKey("");
    setNewTemplateSubject("");
    setNewTemplateHtml("<html><body><h1>Hello!</h1></body></html>");
    setNewTemplateLocale("en");
  };

  if (loading && templates.length === 0) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Email Templates
          </h2>
          <p className="text-muted-foreground">
            Manage your transactional email templates
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={resetForm}
              className="gap-2 shadow-sm transition-all hover:shadow-md"
            >
              <Plus className="h-4 w-4" />
              New Template Key
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Template</DialogTitle>
              <DialogDescription>
                Add a new email notification type.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="key" className="text-right">
                  Key
                </Label>
                <Input
                  id="key"
                  value={newTemplateKey}
                  onChange={(e) => setNewTemplateKey(e.target.value)}
                  placeholder="e.g. welcome_email"
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="locale" className="text-right">
                  Locale
                </Label>
                <Input
                  id="locale"
                  value={newTemplateLocale}
                  onChange={(e) => setNewTemplateLocale(e.target.value)}
                  placeholder="en"
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="subject" className="text-right">
                  Subject
                </Label>
                <Input
                  id="subject"
                  value={newTemplateSubject}
                  onChange={(e) => setNewTemplateSubject(e.target.value)}
                  placeholder="Welcome to {{app.name}}!"
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleCreateTemplate}>
                Create Template
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex max-h-[calc(100vh-12rem)] flex-1 gap-6 overflow-hidden">
        {/* Templates List (Grouped by Key) */}
        <div className="flex w-1/3 min-w-[300px] flex-col gap-4 overflow-y-auto pr-2">
          {uniqueKeys.map((key) => {
            // Find the 'en' version or first available for preview info
            const previewTemplate =
              templates.find((t) => t.key === key && t.locale === "en") ||
              templates.find((t) => t.key === key);
            if (!previewTemplate) return null;

            return (
              <Card
                key={key}
                className={`cursor-pointer border-l-4 transition-all hover:shadow-md ${
                  selectedKey === key
                    ? "border-l-primary bg-accent/10 shadow-md"
                    : "border-l-transparent hover:border-l-primary/50"
                }`}
                onClick={() => {
                  setSelectedKey(key);
                  // Switch to 'en' or first available if current activeLocale doesn't exist for this key
                  const hasCurrentLocale = templates.some(
                    (t) => t.key === key && t.locale === activeLocale,
                  );
                  if (!hasCurrentLocale) {
                    setActiveLocale("en"); // Try 'en', fallback handled in render effectively by check
                  }
                }}
              >
                <CardContent className="p-4">
                  <div className="mb-2 flex items-start justify-between">
                    <div>
                      <h3 className="flex items-center gap-2 font-semibold text-foreground">
                        {key}
                      </h3>
                      <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                        {previewTemplate.subject_template}
                      </p>
                    </div>
                    {/* Show badge count of locales? */}
                    <Badge variant="outline" className="text-[10px]">
                      {templates.filter((t) => t.key === key).length} locales
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {uniqueKeys.length === 0 && (
            <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
              No templates found
            </div>
          )}
        </div>

        {/* Editor Area */}
        <div className="flex flex-1 flex-col overflow-hidden rounded-xl border bg-background shadow-sm">
          {selectedKey ? (
            <>
              {/* Editor Header & Tabs */}
              <div className="border-b bg-muted/30">
                <div className="flex items-start justify-between p-4 pb-2">
                  <div className="flex flex-col gap-1">
                    <h3 className="text-lg font-medium">{selectedKey}</h3>
                    {currentTemplate && (
                      <Badge
                        variant={
                          currentTemplate.is_active ? "default" : "secondary"
                        }
                        className={`w-fit ${currentTemplate.is_active ? "bg-green-600" : ""}`}
                      >
                        {currentTemplate.is_active ? "Active" : "Inactive"}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {currentTemplate && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteTemplate(currentTemplate.id)}
                        className="h-8"
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete{" "}
                        {activeLocale}
                      </Button>
                    )}
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleUpdateTemplate}
                      disabled={!currentTemplate}
                      className="h-8 bg-blue-600 hover:bg-blue-700"
                    >
                      <Save className="mr-2 h-4 w-4" /> Save Changes
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-4">
                  <Tabs
                    value={
                      availableLocalesForKey.includes(activeLocale)
                        ? activeLocale
                        : (availableLocalesForKey[0] ?? "")
                    }
                    onValueChange={setActiveLocale}
                    className="w-full"
                  >
                    <div className="flex w-full items-center justify-between">
                      <TabsList className="h-auto justify-start border-none bg-transparent p-0">
                        {availableLocalesForKey.map((loc) => (
                          <TabsTrigger
                            key={loc}
                            value={loc}
                            className="rounded-b-none rounded-t-md border border-transparent px-4 py-2 data-[state=active]:border-border data-[state=active]:bg-background data-[state=active]:shadow-sm"
                          >
                            {loc.toUpperCase()}
                          </TabsTrigger>
                        ))}
                      </TabsList>

                      <Dialog
                        open={isAddLocaleDialogOpen}
                        onOpenChange={setIsAddLocaleDialogOpen}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1 text-muted-foreground hover:text-primary"
                          >
                            <Plus className="h-3 w-3" /> Add Locale
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                          <DialogHeader>
                            <DialogTitle>Add New Locale</DialogTitle>
                            <DialogDescription>
                              Add a new translation for{" "}
                              <strong>{selectedKey}</strong>. Content will be
                              copied from the current template.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label
                                htmlFor="new-locale"
                                className="text-right"
                              >
                                Locale Code
                              </Label>
                              <Input
                                id="new-locale"
                                value={newLocale}
                                onChange={(e) => setNewLocale(e.target.value)}
                                placeholder="e.g. fr, de, es"
                                className="col-span-3"
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button type="submit" onClick={handleAddLocale}>
                              Add Locale
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </Tabs>
                </div>
              </div>

              {/* Editor Content */}
              {currentTemplate ? (
                <>
                  <div className="space-y-4 border-b p-4">
                    <div className="grid gap-2">
                      <Label htmlFor="edit-subject">Subject Line</Label>
                      <Input
                        id="edit-subject"
                        value={currentTemplate.subject_template}
                        onChange={(e) =>
                          updateLocalTemplate({
                            subject_template: e.target.value,
                          })
                        }
                        className="font-medium"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Label
                          htmlFor="active-toggle"
                          className="cursor-pointer"
                        >
                          Active Status
                        </Label>
                        <Switch
                          id="active-toggle"
                          checked={currentTemplate.is_active}
                          onCheckedChange={(c) =>
                            updateLocalTemplate({ is_active: c })
                          }
                        />
                      </div>

                      <div className="flex rounded-lg bg-muted p-1">
                        <Button
                          variant={viewMode === "code" ? "default" : "ghost"}
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => setViewMode("code")}
                        >
                          <Code className="mr-1 h-3 w-3" /> Code
                        </Button>
                        <Button
                          variant={viewMode === "split" ? "default" : "ghost"}
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => setViewMode("split")}
                        >
                          <LayoutTemplate className="mr-1 h-3 w-3" /> Split
                        </Button>
                        <Button
                          variant={viewMode === "preview" ? "default" : "ghost"}
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => setViewMode("preview")}
                        >
                          <Eye className="mr-1 h-3 w-3" /> Preview
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Main Editor/Preview Area */}
                  <div className="relative flex flex-1 overflow-hidden">
                    {(viewMode === "code" || viewMode === "split") && (
                      <div
                        className={`${viewMode === "split" ? "w-1/2 border-r" : "w-full"} flex h-full flex-col bg-slate-950`}
                      >
                        <div className="border-b border-slate-800 bg-slate-900 px-4 py-1 font-mono text-xs text-slate-400">
                          HTML Source
                        </div>
                        <Textarea
                          value={currentTemplate.html_template}
                          onChange={(e) =>
                            updateLocalTemplate({
                              html_template: e.target.value,
                            })
                          }
                          className="h-full flex-1 resize-none rounded-none border-none bg-transparent p-4 font-mono text-sm leading-relaxed text-slate-200 focus-visible:ring-0"
                          spellCheck={false}
                        />
                      </div>
                    )}

                    {(viewMode === "preview" || viewMode === "split") && (
                      <div
                        className={`${viewMode === "split" ? "w-1/2" : "w-full"} flex h-full flex-col bg-white`}
                      >
                        <div className="flex justify-between border-b bg-slate-100 px-4 py-1 text-xs font-medium text-slate-500">
                          <span>Preview</span>
                          <span className="text-[10px]">
                            Locale: {activeLocale}
                          </span>
                        </div>
                        <div className="flex-1 overflow-auto bg-white">
                          <iframe
                            srcDoc={currentTemplate.html_template}
                            className="h-full w-full border-none"
                            title="Preview"
                            sandbox="allow-same-origin"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex flex-1 items-center justify-center p-8 text-muted-foreground">
                  <p>Select a locale or add a new one.</p>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-muted-foreground">
              <div className="mb-4 rounded-full bg-muted/50 p-6">
                <LayoutTemplate className="h-12 w-12 opacity-50" />
              </div>
              <h3 className="mb-2 text-xl font-medium">
                Select a template key to edit
              </h3>
              <p className="max-w-md text-center">
                Choose a template group from the list on the left to manage its
                translations and configuration.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
