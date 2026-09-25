package com.sloncomp.slon;

import android.content.Context;
import android.util.Base64;

import org.json.JSONObject;

import java.math.BigInteger;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;

import javax.crypto.Cipher;
import javax.crypto.Mac;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;

/**
 * Текст уведомления для зашифрованных чатов.
 * Отправитель шифрует короткий текст под ключ уведомлений ЭТОГО устройства
 * (X25519 → HKDF-SHA256 → AES-256-GCM). Приватный ключ сюда кладёт само приложение
 * (SlonSystem.setNotifKey), на сервер он не уходит. Не получилось — вернём null,
 * и покажем просто «Новое сообщение».
 */
final class SlonNotifKey {
    private SlonNotifKey() { }
    private static final byte[] INFO = "SLON_Notif_v1".getBytes(StandardCharsets.UTF_8);

    static String open(Context c, JSONObject n) {
        if (n == null) return null;
        try {
            android.content.SharedPreferences p = c.getSharedPreferences(SlonBgService.PREFS, Context.MODE_PRIVATE);
            String addr = p.getString("nk_addr", ""), priv = p.getString("nk_priv", "");
            if (addr.isEmpty() || priv.isEmpty()) return null;
            String sealed = n.optString(addr, "");
            if (sealed.isEmpty()) return null;
            byte[] d = Base64.decode(sealed, Base64.NO_WRAP);
            if (d.length < 32 + 12 + 16) return null;
            byte[] sk = Base64.decode(priv, Base64.URL_SAFE | Base64.NO_WRAP | Base64.NO_PADDING);
            byte[] shared = x25519(sk, Arrays.copyOfRange(d, 0, 32));
            byte[] key = hkdf(shared, new byte[32], INFO, 32);
            Cipher ci = Cipher.getInstance("AES/GCM/NoPadding");
            ci.init(Cipher.DECRYPT_MODE, new SecretKeySpec(key, "AES"), new GCMParameterSpec(128, Arrays.copyOfRange(d, 32, 44)));
            String s = new String(ci.doFinal(Arrays.copyOfRange(d, 44, d.length)), StandardCharsets.UTF_8);
            return s.isEmpty() ? null : s;
        } catch (Exception e) { return null; }
    }
    static String open(Context c, String nJson) {
        if (nJson == null || nJson.isEmpty()) return null;
        try { return open(c, new JSONObject(nJson)); } catch (Exception e) { return null; }
    }

    // HKDF-SHA256 (RFC 5869)
    static byte[] hkdf(byte[] ikm, byte[] salt, byte[] info, int len) throws Exception {
        Mac m = Mac.getInstance("HmacSHA256");
        m.init(new SecretKeySpec(salt, "HmacSHA256"));
        byte[] prk = m.doFinal(ikm);
        m.init(new SecretKeySpec(prk, "HmacSHA256"));
        m.update(info); m.update((byte) 1);
        return Arrays.copyOf(m.doFinal(), len);
    }

    // X25519 (RFC 7748) — лесенка Монтгомери; встроенный XDH есть только с Android 13
    private static final BigInteger P = BigInteger.ONE.shiftLeft(255).subtract(BigInteger.valueOf(19));
    private static final BigInteger A24 = BigInteger.valueOf(121665);
    static byte[] x25519(byte[] scalar, byte[] u) {
        byte[] k = scalar.clone();
        k[0] &= (byte) 248; k[31] &= 127; k[31] |= 64;
        byte[] uu = u.clone(); uu[31] &= 127;
        BigInteger kk = le(k), x1 = le(uu).mod(P);
        BigInteger x2 = BigInteger.ONE, z2 = BigInteger.ZERO, x3 = x1, z3 = BigInteger.ONE, t;
        boolean swap = false;
        for (int i = 254; i >= 0; i--) {
            boolean kt = kk.testBit(i);
            if (swap ^ kt) { t = x2; x2 = x3; x3 = t; t = z2; z2 = z3; z3 = t; }
            swap = kt;
            BigInteger a = x2.add(z2).mod(P), aa = a.multiply(a).mod(P);
            BigInteger b = x2.subtract(z2).mod(P), bb = b.multiply(b).mod(P);
            BigInteger e = aa.subtract(bb).mod(P);
            BigInteger c = x3.add(z3).mod(P), dd = x3.subtract(z3).mod(P);
            BigInteger da = dd.multiply(a).mod(P), cb = c.multiply(b).mod(P);
            BigInteger s1 = da.add(cb).mod(P), s2 = da.subtract(cb).mod(P);
            x3 = s1.multiply(s1).mod(P);
            z3 = x1.multiply(s2.multiply(s2)).mod(P);
            x2 = aa.multiply(bb).mod(P);
            z2 = e.multiply(aa.add(A24.multiply(e))).mod(P);
        }
        if (swap) { x2 = x3; z2 = z3; }
        BigInteger r = x2.multiply(z2.modPow(P.subtract(BigInteger.valueOf(2)), P)).mod(P);
        byte[] be = r.toByteArray(), out = new byte[32];
        for (int i = 0; i < 32 && i < be.length; i++) out[i] = be[be.length - 1 - i];
        return out;
    }
    private static BigInteger le(byte[] b) {
        byte[] be = new byte[b.length + 1];
        for (int i = 0; i < b.length; i++) be[b.length - i] = b[i];
        return new BigInteger(be);
    }
}
