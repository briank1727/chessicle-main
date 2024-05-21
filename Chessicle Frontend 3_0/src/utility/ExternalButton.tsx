const ExternalLinkButton = ({ url, children }: { url: string, children: React.ReactNode }) => {
    return (
        <a href={url} target="_blank" rel="noopener noreferrer" className="external-link-button">
            {children}
        </a>
    );
};

export default ExternalLinkButton;