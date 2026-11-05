"use client";

import { useState } from "react";

type LocationState =
  | "idle"
  | "loading"
  | "success"
  | "denied"
  | "timeout"
  | "unavailable";

type VendtakimiProps = {
  initialValue?: string;
};

export function Vendtakimi({ initialValue = "" }: VendtakimiProps) {
  const [teksti, setTeksti] = useState(initialValue);
  const [vendtakimi, setVendtakimi] = useState(initialValue);
  const [meetingError, setMeetingError] = useState("");
  const [locationState, setLocationState] = useState<LocationState>("idle");
  const [locationMessage, setLocationMessage] = useState("");
  const [accuracy, setAccuracy] = useState("");
  const [coordinates, setCoordinates] = useState("");
  const [mapsUrl, setMapsUrl] = useState("");

  function konfirmoVendtakimin() {
    const vlera = teksti.trim();
    if (!vlera) {
      setMeetingError("Shkruaj një vendtakim para se ta konfirmosh.");
      return;
    }

    setVendtakimi(vlera);
    setMeetingError("");
  }

  function kurMerretPozicioni(position: GeolocationPosition) {
    const saktesia = Math.round(position.coords.accuracy);
    const latitude = position.coords.latitude.toFixed(6);
    const longitude = position.coords.longitude.toFixed(6);
    setLocationState("success");
    setLocationMessage("Pozicioni u mor.");
    setAccuracy(`${saktesia} m`);
    setCoordinates(`${latitude}, ${longitude}`);
    setMapsUrl(
      `https://www.google.com/maps/search/?api=1&query=${latitude}%2C${longitude}`,
    );
  }

  function kurDeshtonLeximi(error: GeolocationPositionError) {
    setAccuracy("");
    setCoordinates("");
    setMapsUrl("");
    if (error.code === 1) {
      setLocationState("denied");
      setLocationMessage("Leja u refuzua. Shkruaj vendtakimin vetë.");
    } else if (error.code === 3) {
      setLocationState("timeout");
      setLocationMessage("Kërkesa për vendndodhje skadoi. Provo përsëri ose shkruaj vendtakimin.");
    } else {
      setLocationState("unavailable");
      setLocationMessage("Vendndodhja nuk është e disponueshme. Shkruaj vendtakimin vetë.");
    }
  }

  function perdorVendndodhjen() {
    setMeetingError("");
    setAccuracy("");
    setCoordinates("");
    setMapsUrl("");

    if (!navigator.geolocation) {
      setLocationState("unavailable");
      setLocationMessage("Telefoni nuk e mbështet vendndodhjen. Shkruaj vendtakimin vetë.");
      return;
    }

    setLocationState("loading");
    setLocationMessage("Po kërkojmë vendndodhjen…");
    navigator.geolocation.getCurrentPosition(
      kurMerretPozicioni,
      kurDeshtonLeximi,
      { timeout: 10000 },
    );
  }

  return (
    <div className="meeting-picker">
      <div className="meeting-picker-heading">
        <div>
          <label htmlFor="meeting-input">Shkruaj vendtakimin</label>
          <p className="helper-copy">Zgjidh një pikë të qartë ku mund të takoheni.</p>
        </div>
        <button
          className="button button-secondary"
          type="button"
          onClick={perdorVendndodhjen}
        >
          Përdor vendndodhjen time
        </button>
      </div>
      <div className="meeting-manual">
        <input
          id="meeting-input"
          value={teksti}
          onChange={(event) => {
            setTeksti(event.target.value);
            if (meetingError) setMeetingError("");
          }}
          placeholder="p.sh. Biblioteka"
        />
        <button
          className="button button-primary"
          type="button"
          onClick={konfirmoVendtakimin}
        >
          Konfirmo në telefon
        </button>
      </div>
      <p className="meeting-error" role="alert">
        {meetingError}
      </p>
      <p className="confirmed-meeting">
        {vendtakimi ? `Vendtakimi i konfirmuar: ${vendtakimi}` : ""}
      </p>
      <p
        className={`location-status location-status-${locationState}`}
        aria-live="polite"
      >
        {locationMessage}
      </p>
      <p className="location-accuracy">
        {accuracy ? `Saktësia: ${accuracy}` : ""}
      </p>
      <p className="location-coordinates">
        {coordinates ? `Koordinatat: ${coordinates}` : ""}
      </p>
      {mapsUrl ? (
        <a
          className="maps-link"
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Hape në Google Maps <span aria-hidden="true">↗</span>
        </a>
      ) : null}
    </div>
  );
}
