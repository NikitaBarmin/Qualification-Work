import { Alert, Button, Input, Select, Typography } from 'antd';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';

import { useRegisterMutation } from '@/entities/session';
import { getApiErrorMessage } from '@/shared/api';

import styles from './SignUpPage.module.scss';

const signUpSchema = z.object({
  email: z.string().trim().email('Введите корректный email'),
  password: z.string().min(8, 'Пароль должен быть не короче 8 символов'),
  businessType: z.string().optional(),
});

type SignUpFormValues = z.infer<typeof signUpSchema>;

const businessTypeOptions = [
  { label: 'Интернет-магазин', value: 'ecommerce' },
  { label: 'Локальный сервис', value: 'local_service' },
  { label: 'SaaS / онлайн-сервис', value: 'saas' },
];

export function SignUpPage() {
  const navigate = useNavigate();
  const [registerUser, { isLoading }] = useRegisterMutation();
  const [formError, setFormError] = useState<string | null>(null);
  const [businessType, setBusinessType] = useState<string | undefined>();
  const {
    formState: { errors },
    handleSubmit,
    register,
    setError,
  } = useForm<SignUpFormValues>({
    defaultValues: {
      email: '',
      password: '',
      businessType: undefined,
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const parsedValues = signUpSchema.safeParse({ ...values, businessType });

    if (!parsedValues.success) {
      for (const issue of parsedValues.error.issues) {
        const fieldName = issue.path[0] as keyof SignUpFormValues;
        setError(fieldName, { message: issue.message });
      }
      return;
    }

    try {
      await registerUser(parsedValues.data).unwrap();
      navigate('/analytics/new', { replace: true });
    } catch (error) {
      setFormError(getApiErrorMessage(error, 'Не удалось зарегистрироваться'));
    }
  });

  return (
    <form className={styles.form} data-stack="v" data-gap="16" onSubmit={onSubmit}>
      <div>
        <Typography.Title className={styles.title} level={1}>
          Регистрация
        </Typography.Title>
        <p className={styles.caption}>Создайте аккаунт, чтобы сохранять датасеты и анализы.</p>
      </div>

      {formError && <Alert type="error" showIcon message={formError} />}

      <label className={styles.field} data-stack="v" data-gap="6">
        <span>Email</span>
        <Input {...register('email')} autoComplete="email" placeholder="owner@company.ru" />
        <span className={styles.error}>{errors.email?.message}</span>
      </label>

      <label className={styles.field} data-stack="v" data-gap="6">
        <span>Пароль</span>
        <Input.Password
          {...register('password')}
          autoComplete="new-password"
          placeholder="Минимум 8 символов"
        />
        <span className={styles.error}>{errors.password?.message}</span>
      </label>

      <label className={styles.field} data-stack="v" data-gap="6">
        <span>Тип бизнеса</span>
        <Select
          allowClear
          options={businessTypeOptions}
          placeholder="Можно выбрать позже"
          value={businessType}
          onChange={setBusinessType}
        />
        <span className={styles.error}>{errors.businessType?.message}</span>
      </label>

      <Button type="primary" htmlType="submit" loading={isLoading} block>
        Создать аккаунт
      </Button>

      <p className={styles.footer}>
        Уже есть аккаунт? <Link to="/sign-in">Войти</Link>
      </p>
    </form>
  );
}
