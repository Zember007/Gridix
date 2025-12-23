import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Crown, Lock, ArrowRight } from 'lucide-react';
import { useSubscription } from '../../hooks/useSubscription';
import { Link } from 'react-router-dom';

interface SubscriptionGuardProps {
  children: React.ReactNode;
  requiredPlan?: 'basic' | 'pro';
  requiredFeature?: string;
  fallback?: React.ReactNode;
}

export function SubscriptionGuard({ 
  children, 
  requiredPlan = 'basic', 
  requiredFeature,
  fallback 
}: SubscriptionGuardProps) {
  const { subscription, hasFeature, isActive, isPro, isBasic, loading } = useSubscription();

  if (loading) {
    return (
      <div className=\"flex justify-center items-center py-8\">
        <div className=\"animate-spin rounded-full h-6 w-6 border-b-2 border-primary\"></div>
      </div>
    );
  }

  // Check if user has active subscription
  if (!isActive()) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <Card className=\"max-w-md mx-auto mt-8\">
        <CardHeader className=\"text-center\">
          <div className=\"flex justify-center mb-2\">
            <Lock className=\"w-12 h-12 text-muted-foreground\" />
          </div>
          <CardTitle>Требуется подписка</CardTitle>
          <CardDescription>
            Для доступа к этой функции необходима активная подписка
          </CardDescription>
        </CardHeader>
        <CardContent className=\"space-y-4\">
          <div className=\"text-center space-y-2\">
            <Badge variant=\"outline\" className=\"mb-2\">
              Требуется: {requiredPlan === 'pro' ? 'Pro план' : 'Basic план'}
            </Badge>
            {requiredFeature && (
              <p className=\"text-sm text-muted-foreground\">
                Функция: {requiredFeature}
              </p>
            )}
          </div>
          <Button asChild className=\"w-full\">
            <Link to=\"/subscription\">
              Выбрать план
              <ArrowRight className=\"w-4 h-4 ml-2\" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Check specific feature requirement
  if (requiredFeature && !hasFeature(requiredFeature)) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <Card className=\"max-w-md mx-auto mt-8\">
        <CardHeader className=\"text-center\">
          <div className=\"flex justify-center mb-2\">
            <Crown className=\"w-12 h-12 text-yellow-500\" />
          </div>
          <CardTitle>Требуется Pro план</CardTitle>
          <CardDescription>
            Эта функция доступна только в Pro плане
          </CardDescription>
        </CardHeader>
        <CardContent className=\"space-y-4\">
          <div className=\"text-center space-y-2\">
            <Badge className=\"bg-yellow-500 text-yellow-900\">
              {requiredFeature}
            </Badge>
            <p className=\"text-sm text-muted-foreground\">
              Обновитесь до Pro плана для получения доступа
            </p>
          </div>
          <Button asChild className=\"w-full\">
            <Link to=\"/subscription\">
              Обновить план
              <ArrowRight className=\"w-4 h-4 ml-2\" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Check plan requirement
  if (requiredPlan === 'pro' && !isPro()) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <Card className=\"max-w-md mx-auto mt-8\">
        <CardHeader className=\"text-center\">
          <div className=\"flex justify-center mb-2\">
            <Crown className=\"w-12 h-12 text-yellow-500\" />
          </div>
          <CardTitle>Требуется Pro план</CardTitle>
          <CardDescription>
            У вас Basic план. Обновитесь до Pro для доступа к этой функции
          </CardDescription>
        </CardHeader>
        <CardContent className=\"space-y-4\">
          <div className=\"text-center space-y-2\">
            <div className=\"flex justify-center space-x-2\">
              <Badge variant=\"outline\">Текущий: Basic</Badge>
              <Badge className=\"bg-yellow-500 text-yellow-900\">Требуется: Pro</Badge>
            </div>
          </div>
          <Button asChild className=\"w-full\">
            <Link to=\"/subscription\">
              Обновить до Pro
              <ArrowRight className=\"w-4 h-4 ml-2\" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // All checks passed, render children
  return <>{children}</>;
}

// Hook for checking subscription status in components
export function useSubscriptionGuard() {
  const { hasFeature, isActive, isPro, isBasic, subscription } = useSubscription();

  const canAccess = (requiredPlan?: 'basic' | 'pro', requiredFeature?: string) => {
    if (!isActive()) return false;
    
    if (requiredFeature && !hasFeature(requiredFeature)) return false;
    
    if (requiredPlan === 'pro' && !isPro()) return false;
    
    return true;
  };

  const getAccessLevel = () => {
    if (!isActive()) return 'none';
    if (isPro()) return 'pro';
    if (isBasic()) return 'basic';
    return 'none';
  };

  return {
    canAccess,
    getAccessLevel,
    hasFeature,
    isActive,
    isPro,
    isBasic,
    subscription,
  };
}
