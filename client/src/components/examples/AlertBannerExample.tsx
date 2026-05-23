import { useState } from "react";
import AlertBanner from "../AlertBanner";

export default function AlertBannerExample() {
  const [dismissed, setDismissed] = useState(false);

  return (
    <div className="space-y-4">
      <AlertBanner
        isVisible={!dismissed}
        message="Coupure d'eau imprévue dans le secteur Nord - Rétablissement prévu à 18h"
        severity="danger"
        onDismiss={() => setDismissed(true)}
      />
      <AlertBanner
        isVisible={true}
        message="Travaux de maintenance prévus demain de 6h à 12h"
        severity="warning"
      />
    </div>
  );
}
