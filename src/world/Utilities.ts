export class Utilities {
    static unitConversion: { [key: string]: number } = {
        pm: 1e-12,
        nm: 1e-9,
        "μm": 1e-6,
        mm: 1e-3,
        cm: 1e-2,
        m: 1,
        km: 1e3,
        au: 149597870700,
        ly: 9.4607e15,
        pc: 3.08567758149137e16,
        in: 0.0254,
        ft: 0.3048,
        yd: 0.9144,
        mi: 1609.344,
        ftm: 1.8288,
        nmi: 1852,
    };

    private static _worldSize: number = 1;
    private static _unit: string = "m";
    static keyState: { [key: string]: boolean } = { ControlLeft: false };
    static simulationTime: number = 1;

    static getWorldSize(): number {
        return Utilities._worldSize;
    }

    static setWorldSize(value: number): void {
        Utilities._worldSize = value;
    }

    static getUnit(): string {
        return Utilities._unit;
    }

    static setUnit(value: string): void {
        Utilities._unit = value;
    }

    static getWorldScale(): number {
        return Utilities.convertUnit(Utilities._worldSize);
    }

    static convertUnit(value: number): number {
        if (Utilities._unit in Utilities.unitConversion) {
            return value * Utilities.unitConversion[Utilities._unit];
        } else {
            console.warn(`Unit "${Utilities._unit}" not recognized. Returning original value.`);
            return value;
        }
    }

    static getKeyState(): { [key: string]: boolean } {
        return Utilities.keyState;
    }

    static stringifiyUnit(value: number): string {
        let plain = value.toString();
        if (!plain.includes("e") && plain.length <= 7) {
            return plain;
        }

        for (let frac = 6; frac >= 0; frac--) {
            let expStr = value.toExponential(frac);
            let [mantissa, exponent] = expStr.split("e");
            let digits = mantissa.replace(".", "");
            if (digits.length <= 7) {
                if (parseInt(exponent, 10) === 0) {
                    return mantissa;
                }
                return mantissa + "e" + exponent;
            }
        }
        return value.toExponential(0);
    }

    static mapRangeToRange(value: number, start1: number, stop1: number, start2: number, stop2: number, withinBounds: boolean): number {
        const newval: number = (value - start1) / (stop1 - start1) * (stop2 - start2) + start2;
        if (!withinBounds) {
            return newval;
        }
        if (start2 < stop2) {
            return Utilities.constrainNumber(newval, start2, stop2);
        } else {
            return Utilities.constrainNumber(newval, stop2, start2);
        }
    }

    static constrainNumber(value: number, low: number, high: number): number {
        return Math.max(Math.min(value, high), low);
    }
}

export default Utilities;