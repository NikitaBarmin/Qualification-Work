import { Alert, Button, Input, Typography } from 'antd';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';

import { useLoginMutation } from '@/entities/session';
import { getApiErrorMessage } from '@/shared/api';

import styles from './SignInPage.module.scss';

const signInSchema = z.object({
  email: z.string().trim().email('Введите корректный email'),
  password: z.string().min(1, 'Введите пароль'),
});

type SignInFormValues = z.infer<typeof signInSchema>;

interface ILocationState {
  from?: {
    pathname?: string;
  };
}

export function SignInPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [login, { isLoading }] = useLoginMutation();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    clearErrors,
    control,
    formState: { errors },
    handleSubmit,
    setError,
  } = useForm<SignInFormValues>({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    clearErrors();
    const parsedValues = signInSchema.safeParse(values);

    if (!parsedValues.success) {
      for (const issue of parsedValues.error.issues) {
        const fieldName = issue.path[0] as keyof SignInFormValues;
        setError(fieldName, { message: issue.message });
      }
      return;
    }

    try {
      await login(parsedValues.data).unwrap();
      const state = location.state as ILocationState | null;
      navigate(state?.from?.pathname ?? '/analytics/new', { replace: true });
    } catch (error) {
      setFormError(getApiErrorMessage(error, 'Не удалось войти'));
    }
  });

  return (
    <form className={styles.form} data-stack="v" data-gap="16" onSubmit={onSubmit}>
      <div>
        <Typography.Title className={styles.title} level={1}>
          Авторизация
        </Typography.Title>
        <p className={styles.caption}>Войдите, чтобы продолжить работу с аналитикой.</p>
      </div>

      {formError && <Alert type="error" showIcon message={formError} />}

      <label className={styles.field} data-stack="v" data-gap="6">
        <span>Email</span>
        <Controller
          control={control}
          name="email"
          render={({ field }) => (
            <Input
              {...field}
              autoComplete="email"
              placeholder="owner@company.ru"
              onChange={(event) => {
                field.onChange(event.target.value);
                clearErrors('email');
              }}
            />
          )}
        />
        <span className={styles.error}>{errors.email?.message}</span>
      </label>

      <label className={styles.field} data-stack="v" data-gap="6">
        <span>Пароль</span>
        <Controller
          control={control}
          name="password"
          render={({ field }) => (
            <Input.Password
              {...field}
              autoComplete="current-password"
              placeholder="Введите пароль"
              onChange={(event) => {
                field.onChange(event.target.value);
                clearErrors('password');
              }}
            />
          )}
        />
        <span className={styles.error}>{errors.password?.message}</span>
      </label>

      <Button type="primary" htmlType="submit" loading={isLoading} block>
        Войти
      </Button>

      <p className={styles.footer}>
        Нет аккаунта? <Link to="/sign-up">Зарегистрироваться</Link>
      </p>
    </form>
  );
}
