import base64
import io

import qrcode
from qrcode import constants


class QRCodeService:
    """Utility methods for generating and parsing VoltReserve QR payloads."""

    @staticmethod
    def generate_qr_code(reservation):
        payload = '|'.join([
            'VOLTRESERVE',
            f'TOKEN:{reservation.qr_token}',
            f'RESERVATION:{reservation.id}',
            f'BOOKING:{reservation.booking_id}',
            f'USER:{reservation.user_id}',
            f'STATION:{reservation.station_id}',
            f'PORT:{reservation.port_id}',
            f'START:{reservation.reserved_at.isoformat()}Z',
            f'EXPIRES:{reservation.expires_at.isoformat()}Z',
        ])

        qr = qrcode.QRCode(
            version=1,
            error_correction=constants.ERROR_CORRECT_M,
            box_size=10,
            border=4,
        )
        qr.add_data(payload)
        qr.make(fit=True)

        image = qr.make_image(fill_color="black", back_color="white")
        buffer = io.BytesIO()
        image.save(buffer, format="PNG")
        image_bytes = buffer.getvalue()
        encoded = base64.b64encode(image_bytes).decode("utf-8")

        return {
            "data": payload,
            "booking_id": reservation.booking_id,
            "reservation_id": reservation.id,
            "station_id": reservation.station_id,
            "port_id": reservation.port_id,
            "station_name": reservation.station.name,
            "port_number": reservation.port.port_number,
            "user_id": reservation.user_id,
            "reserved_at": reservation.reserved_at.isoformat() + "Z",
            "expires_at": reservation.expires_at.isoformat() + "Z",
            "token": reservation.qr_token,
            "image_base64": encoded,
            "image_data_url": f"data:image/png;base64,{encoded}",
        }

    @staticmethod
    def parse_qr_data(qr_data):
        parsed = {}
        if not qr_data:
            return parsed

        for part in str(qr_data).split("|"):
            if ":" not in part:
                continue
            key, value = part.split(":", 1)
            parsed[key.strip().lower()] = value.strip()

        return parsed
