
import { useState, useEffect } from 'react';
import { Image as ImageIcon } from 'lucide-react';

interface S3ImageProps {
    src: string;
    alt: string;
    className?: string;
    onError?: () => void;
}

export function S3Image({ src, alt, className, onError }: S3ImageProps) {
    const [hasError, setHasError] = useState(false);
    const [imgSrc, setImgSrc] = useState<string | null>(null);
    const [svgContent, setSvgContent] = useState<string | null>(null);
    const isSvg = imgSrc?.toLowerCase().includes('.svg');

    useEffect(() => {
        // Basic S3 URL construction if partial
        if (src && !src.startsWith('http') && !src.startsWith('blob:')) {
            const baseUrl = import.meta.env.VITE_S3_BASE_URL || 'https://roamania.s3.ap-south-1.amazonaws.com/images/moods';
            const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
            const cleanPath = src.startsWith('/') ? src.slice(1) : src;
            setImgSrc(`${cleanBase}/${cleanPath}`);
        } else {
            setImgSrc(src);
        }
    }, [src]);

    const handleError = () => {
        setHasError(true);
        if (onError) onError();
    };

    useEffect(() => {
        if (isSvg && imgSrc && !hasError) {
            fetch(imgSrc)
                .then(res => {
                    if (!res.ok) throw new Error('Failed to fetch');
                    return res.text();
                })
                .then(text => {
                    if (text.includes('<svg')) {
                        setSvgContent(text);
                    }
                })
                .catch(() => {
                    // console.error('Failed to fetch SVG', err);
                });
        }
    }, [imgSrc, isSvg, hasError]);

    if (hasError || !imgSrc) {
        return (
            <div className={`flex items-center justify-center bg-gray-50 text-gray-300 ${className}`} title="Image failed to load">
                <ImageIcon className="w-1/2 h-1/2" />
            </div>
        );
    }



    if (isSvg && svgContent) {
        return (
            <div
                className={className}
                dangerouslySetInnerHTML={{ __html: svgContent }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            />
        );
    }

    return (
        <img
            src={imgSrc}
            alt={alt}
            className={className}
            onError={handleError}
            loading="lazy"
        />
    );
}
