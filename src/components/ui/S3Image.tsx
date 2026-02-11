import { useState, useEffect } from 'react';

interface S3ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src: string;
}

export const S3Image = ({ src, alt, className, style, ...props }: S3ImageProps) => {
    const [imageSrc, setImageSrc] = useState<string>(src);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        let objectUrl: string | null = null;

        const fixS3Svg = async () => {
            // Only attempt fix for S3 SVGs that haven't errored already
            if (src && src.includes('s3') && src.toLowerCase().includes('.svg')) {
                try {
                    const response = await fetch(src);
                    if (!response.ok) throw new Error('Fetch failed');

                    const blob = await response.blob();
                    // Force correct SVG MIME type
                    const svgBlob = new Blob([blob], { type: 'image/svg+xml' });
                    objectUrl = URL.createObjectURL(svgBlob);
                    setImageSrc(objectUrl);
                    setHasError(false);
                } catch (error) {
                    console.warn('Failed to fix S3 SVG mime type:', error);
                    // Fallback to original src if fetch fails (e.g. CORS)
                    setImageSrc(src);
                    setHasError(true);
                }
            } else {
                setImageSrc(src);
            }
        };

        fixS3Svg();

        return () => {
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [src]);

    return (
        <img
            src={imageSrc}
            alt={alt}
            className={className}
            style={style}
            onError={(e) => {
                // If the fixed URL fails, try original as last resort
                if (imageSrc !== src && !hasError) {
                    setImageSrc(src);
                    setHasError(true);
                }
                if (props.onError) props.onError(e);
            }}
            {...props}
        />
    );
};
