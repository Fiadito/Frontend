import {UserRole} from '@/iam/domain/model/user-role.js';

/**
 * Entity: an access account (USUARIO).
 */
export class User {
    /**
     * @param {Object} props
     * @param {number|null} props.id
     * @param {number} props.businessId
     * @param {number|null} [props.memberId] - Null for the business account.
     * @param {string} props.name
     * @param {string} props.email
     * @param {string} props.role - NEGOCIO or SOCIO.
     * @param {string} [props.businessName] - Commercial name (for the top bar).
     */
    constructor({id = null, businessId, memberId = null, name, email, role, businessName = ''}) {
        this.id = id;
        this.businessId = businessId;
        this.memberId = memberId;
        this.name = name;
        this.email = email;
        this.role = role;
        this.businessName = businessName;
    }

    /** @returns {boolean} */
    isBusiness() {
        return this.role === UserRole.BUSINESS;
    }

    /** @returns {boolean} */
    isMember() {
        return this.role === UserRole.MEMBER;
    }

    /** @returns {string} Initials for the avatar. */
    get initials() {
        return this.name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0].toUpperCase()).join('');
    }
}
