import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@gridix/ui";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@gridix/ui";
import { supabase } from "@gridix/utils/api";
import { Loader } from "@gridix/ui";
import { motion } from "framer-motion";

interface Project {
  id: string;
  name: string;
  slug: string;
  address: string;
  building_image_url: string | null;
}

export default function AgentProjectsPage() {
  const { agentId } = useParams();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    async function fetchProjects() {
      if (!agentId) return;
      try {
        const { data, error } = await supabase.functions.invoke(
          "agent-program",
          {
            body: {
              action: "list_projects",
              agent_id: agentId,
            },
          },
        );

        if (error) throw error;
        setProjects(data.projects || []);
      } catch (error) {
        console.error("Error fetching agent projects:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchProjects();
  }, [agentId]);

  const handleOpenProject = (project: Project) => {
    // Navigate to the project page with agent_id in query
    navigate(`/${language}/project/${project.slug}?agent_id=${agentId}`);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-12">
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-4xl font-extrabold tracking-tight text-gray-900"
          >
            Your Projects
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-4 text-xl text-gray-500"
          >
            Select a project to view details and share with your clients.
          </motion.p>
        </header>

        {projects.length === 0 ? (
          <Card className="border-none bg-white p-12 text-center shadow-sm">
            <CardTitle className="text-gray-400">
              No projects assigned yet
            </CardTitle>
            <CardDescription className="mt-2 text-gray-500">
              When the developer gives you access to projects, they will appear
              here.
            </CardDescription>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="group flex h-full flex-col overflow-hidden border-none bg-white shadow-md transition-all duration-300 hover:shadow-2xl">
                  <div className="relative aspect-[16/9] w-full overflow-hidden">
                    {project.building_image_url ? (
                      <img
                        src={project.building_image_url}
                        alt={project.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gray-200">
                        <span className="text-gray-400">No Image</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/20 transition-colors group-hover:bg-black/40" />
                  </div>
                  <CardHeader>
                    <CardTitle className="line-clamp-1 text-xl font-bold">
                      {project.name}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {project.address}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="mt-auto">
                    <Button
                      onClick={() => handleOpenProject(project)}
                      className="h-11 w-full rounded-lg bg-black font-medium text-white transition-colors hover:bg-gray-800"
                    >
                      Open Project
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
