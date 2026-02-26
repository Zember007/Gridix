import { useState, useEffect } from "react";
import { supabase } from "@gridix/utils/api";
import { Button } from "@gridix/ui";
import { Card } from "@gridix/ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@gridix/ui";
import { Eye, CheckCircle, XCircle, Trash2 } from "lucide-react";
import { toast } from "@gridix/ui";
import { Badge } from "@gridix/ui";
import { useLanguage } from "@/contexts/LanguageContext";

interface Project {
  id: string;
  name: string;
  slug: string | null;
  is_public: boolean;
  is_featured: boolean;
  view_count: number;
  created_at: string;
  user_profiles: {
    email: string | null;
    full_name: string | null;
  } | null;
}

export function ProjectsManagement() {
  const { t } = useLanguage();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select(
          `
          *,
          user_profiles (email, full_name)
        `,
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast({
        title: t("admin.superadmin.projectsManagement.toast.errorTitle"),
        description: t(
          "admin.superadmin.projectsManagement.toast.loadProjectsError",
        ),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePublic = async (projectId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("projects")
        .update({ is_public: !currentStatus })
        .eq("id", projectId);

      if (error) throw error;

      toast({
        title: t("admin.superadmin.projectsManagement.toast.successTitle"),
        description: !currentStatus
          ? t("admin.superadmin.projectsManagement.toast.projectPublished")
          : t("admin.superadmin.projectsManagement.toast.projectHidden"),
      });

      fetchProjects();
    } catch (error) {
      console.error("Error toggling project visibility:", error);
      toast({
        title: t("admin.superadmin.projectsManagement.toast.errorTitle"),
        description: t(
          "admin.superadmin.projectsManagement.toast.updateVisibilityError",
        ),
        variant: "destructive",
      });
    }
  };

  const toggleFeatured = async (projectId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("projects")
        .update({ is_featured: !currentStatus })
        .eq("id", projectId);

      if (error) throw error;

      toast({
        title: t("admin.superadmin.projectsManagement.toast.successTitle"),
        description: !currentStatus
          ? t(
              "admin.superadmin.projectsManagement.toast.projectAddedToFeatured",
            )
          : t(
              "admin.superadmin.projectsManagement.toast.projectRemovedFromFeatured",
            ),
      });

      fetchProjects();
    } catch (error) {
      console.error("Error toggling featured status:", error);
      toast({
        title: t("admin.superadmin.projectsManagement.toast.errorTitle"),
        description: t(
          "admin.superadmin.projectsManagement.toast.updateStatusError",
        ),
        variant: "destructive",
      });
    }
  };

  const deleteProject = async (projectId: string) => {
    if (!confirm(t("admin.superadmin.projectsManagement.confirmDelete"))) {
      return;
    }

    try {
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", projectId);

      if (error) throw error;

      toast({
        title: t("admin.superadmin.projectsManagement.toast.successTitle"),
        description: t(
          "admin.superadmin.projectsManagement.toast.projectDeleted",
        ),
      });

      fetchProjects();
    } catch (error) {
      console.error("Error deleting project:", error);
      toast({
        title: t("admin.superadmin.projectsManagement.toast.errorTitle"),
        description: t(
          "admin.superadmin.projectsManagement.toast.deleteProjectError",
        ),
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        {t("admin.superadmin.projectsManagement.loading")}
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">
          {t("admin.superadmin.projectsManagement.title")}
        </h2>
      </div>

      <Card className="p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                {t("admin.superadmin.projectsManagement.table.name")}
              </TableHead>
              <TableHead>
                {t("admin.superadmin.projectsManagement.table.owner")}
              </TableHead>
              <TableHead>
                {t("admin.superadmin.projectsManagement.table.views")}
              </TableHead>
              <TableHead>
                {t("admin.superadmin.projectsManagement.table.status")}
              </TableHead>
              <TableHead>
                {t("admin.superadmin.projectsManagement.table.createdAt")}
              </TableHead>
              <TableHead>
                {t("admin.superadmin.projectsManagement.table.actions")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((project) => (
              <TableRow key={project.id}>
                <TableCell className="font-medium">{project.name}</TableCell>
                <TableCell>
                  <div>
                    <div>
                      {project.user_profiles?.full_name ||
                        t("admin.superadmin.projectsManagement.emptyValue")}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {project.user_profiles?.email}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <Eye className="mr-1 h-4 w-4 text-muted-foreground" />
                    {project.view_count}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {project.is_public && (
                      <Badge variant="outline">
                        {t("admin.superadmin.projectsManagement.badges.public")}
                      </Badge>
                    )}
                    {project.is_featured && (
                      <Badge variant="secondary">
                        {t(
                          "admin.superadmin.projectsManagement.badges.featured",
                        )}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {new Date(project.created_at).toLocaleDateString("en-US")}
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        togglePublic(project.id, project.is_public)
                      }
                    >
                      {project.is_public ? (
                        <>
                          <XCircle className="mr-1 h-4 w-4" />
                          {t(
                            "admin.superadmin.projectsManagement.actions.hide",
                          )}
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mr-1 h-4 w-4" />
                          {t(
                            "admin.superadmin.projectsManagement.actions.publishShort",
                          )}
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        toggleFeatured(project.id, project.is_featured)
                      }
                    >
                      {t("admin.superadmin.projectsManagement.actions.feature")}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteProject(project.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
