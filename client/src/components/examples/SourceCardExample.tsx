import SourceCard from "../SourceCard";

export default function SourceCardExample() {
  return (
    <div className="space-y-3">
      <SourceCard
        name="Préfecture de Mayotte"
        description="Communiqués officiels et informations sur la gestion de l'eau"
        url="https://www.mayotte.gouv.fr/"
      />
      <SourceCard
        name="Mahoraise des Eaux (SMAE)"
        description="Service gestionnaire de l'eau potable à Mayotte"
        url="https://www.smae.yt/"
      />
    </div>
  );
}
