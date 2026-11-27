import { useState } from 'react';
import type { FormEvent } from 'react';

import { Clock, Stethoscope } from 'lucide-react';

import Button from '@/components/common/Button';
import TextField from '@/components/common/TextField';
import SelectField from '@/components/common/SelectField';

import { serviceService } from '@/services/serviceService';
import { getApiError } from '@/utils/apiError';

import type {
    Service,
    CreateServiceRequest,
} from '@/types/service.types';

import styles from './ServiceForm.module.css';

interface ServiceFormProps {
    initialService?: Service;
    onCancel: () => void;
    onSuccess: (message: string) => void;
    onBusyChange: (busy: boolean) => void;
}

export default function ServiceForm({
    initialService,
    onCancel,
    onSuccess,
    onBusyChange,
}: ServiceFormProps) {

    const isEditing = Boolean(initialService);

    const [name, setName] = useState(
        initialService?.name ?? ''
    );

    const [description, setDescription] = useState(
        initialService?.description ?? ''
    );

    const [basePrice, setBasePrice] = useState(
        initialService?.basePrice.toString() ?? ''
    );

    const [durationMinutes, setDurationMinutes] = useState(
        initialService?.durationMinutes.toString() ?? ''
    );

    const [isClinical, setIsClinical] = useState(
        initialService?.isClinical.toString() ?? 'true'
    );

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    // ========================================
    // REGISTRAR O ACTUALIZAR
    // ========================================

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        if (saving) return;

        setError('');

        const price = Number(basePrice);
        const duration = Number(durationMinutes);

        // Validar nombre

        if (!name.trim()) {
            setError('El nombre del servicio es obligatorio.');
            return;
        }

        if (name.trim().length > 150) {
            setError('El nombre no puede superar 150 caracteres.');
            return;
        }

        // Validar precio

        if (
            basePrice.trim() === '' ||
            !Number.isFinite(price) ||
            price < 0
        ) {
            setError('Ingrese un precio mayor o igual a cero.');
            return;
        }

        // Validar duración

        if (
            !Number.isInteger(duration) ||
            duration <= 0 ||
            duration > 2147483647
        ) {
            setError('Ingrese una duración válida en minutos.');
            return;
        }

        const request: CreateServiceRequest = {
            name: name.trim(),
            description: description.trim() || null,
            basePrice: price,
            durationMinutes: duration,
            isClinical: isClinical === 'true',
        };

        setSaving(true);
        onBusyChange(true);

        try {
            if (initialService) {

                await serviceService.update({
                    id: initialService.id,
                    ...request,
                });

                onSuccess(
                    'Servicio actualizado correctamente.'
                );

            } else {

                await serviceService.create(request);

                onSuccess(
                    'Servicio registrado correctamente.'
                );
            }

        } catch (err) {
            setError(
                getApiError(
                    err,
                    'No se pudo guardar el servicio.'
                )
            );
        } finally {
            setSaving(false);
            onBusyChange(false);
        }
    }

    // ========================================
    // FORMULARIO
    // ========================================

    return (
        <form
            className={styles.form}
            onSubmit={handleSubmit}
        >

            {error && (
                <div
                    className={styles.error}
                    role="alert"
                >
                    {error}
                </div>
            )}

            <TextField
                label="Nombre del servicio"
                placeholder="Ej. Consulta veterinaria"
                value={name}
                maxLength={150}
                onChange={event =>
                    setName(event.target.value)
                }
                required
                disabled={saving}
            />

            <div className={styles.descriptionField}>
                <label htmlFor="service-description">
                    Descripción
                </label>

                <textarea
                    id="service-description"
                    className={styles.textarea}
                    placeholder="Describe en qué consiste el servicio..."
                    value={description}
                    onChange={event =>
                        setDescription(event.target.value)
                    }
                    rows={3}
                    disabled={saving}
                />
            </div>

            <div className={styles.fields}>

                <TextField
                    label="Precio base (S/)"
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={basePrice}
                    onChange={event => {
                        const value = event.target.value;

                        if (/^\d*(\.\d{0,2})?$/.test(value)) {
                            setBasePrice(value);
                        }
                    }}
                    required
                    disabled={saving}
                />

                <TextField
                    label="Duración (minutos)"
                    type="text"
                    inputMode="numeric"
                    placeholder="30"
                    value={durationMinutes}
                    onChange={event => {
                        const value = event.target.value;

                        if (/^\d*$/.test(value)) {
                            setDurationMinutes(value);
                        }
                    }}
                    required
                    disabled={saving}
                />

            </div>

            <SelectField
                label="Tipo de servicio"
                value={isClinical}
                options={[
                    {
                        value: 'true',
                        label: 'Clínico',
                    },
                    {
                        value: 'false',
                        label: 'No clínico',
                    },
                ]}
                onChange={event =>
                    setIsClinical(event.target.value)
                }
                required
                disabled={saving}
            />

            <div className={styles.information}>
                <Stethoscope size={20} />

                <div>
                    <strong>
                        {isClinical === 'true'
                            ? 'Servicio clínico'
                            : 'Servicio no clínico'}
                    </strong>

                    <p>
                        {isClinical === 'true'
                            ? 'Consultas, vacunaciones y otros procedimientos médicos.'
                            : 'Baños, peluquería y otros servicios no médicos.'}
                    </p>
                </div>
            </div>

            <div className={styles.summary}>

                <div>
                    <span>Precio base</span>

                    <strong>
                        S/ {(Number(basePrice) || 0).toFixed(2)}
                    </strong>
                </div>

                <div>
                    <span>
                        <Clock size={14} />
                        Duración
                    </span>

                    <strong>
                        {Number(durationMinutes) || 0} min
                    </strong>
                </div>

            </div>

            <div className={styles.actions}>

                <Button
                    variant="outline"
                    onClick={onCancel}
                    disabled={saving}
                >
                    Cancelar
                </Button>

                <Button
                    type="submit"
                    loading={saving}
                >
                    {isEditing
                        ? 'Guardar cambios'
                        : 'Registrar servicio'}
                </Button>

            </div>

        </form>
    );
}