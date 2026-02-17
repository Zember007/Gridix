import { Navigate, useParams } from "react-router-dom";

const Index = () => {
  const { lang } = useParams();

  return <Navigate to={`/${lang}/admin`} replace />;
};

export default Index;
