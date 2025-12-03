import Loader from '@/components/ui/loader';
import { useEffect, useState } from 'react';

interface LoaderViewProps {
    color: string;
    loading: boolean;
}

const LoaderView = ({ color, loading }: LoaderViewProps) => {
    const [isLoading, setIsLoading] = useState(loading);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        
        if (!loading) {
            timer = setTimeout(() => {
                setIsLoading(loading);
            }, 500);
        } else {
            setIsLoading(loading);
        }

        return () => { if (timer) clearTimeout(timer); };
    }, [loading]);

    if(!isLoading) return null;

    return (
        <div className={`${loading ? 'translate-y-0' : '-translate-y-full !bg-white/80'} transition-all ease-out duration-500 fixed z-50 inset-0 bg-white backdrop-blur-sm flex items-center justify-center`}>
            <Loader
                color={color}
                size="lg"
                className="mx-auto"
            />
        </div>
    );
};

export default LoaderView;