import latinize from 'latinize'

class Handler {
    public static toUrl(string: string): string {
        return latinize(string.toLowerCase().replaceAll('.', '-').replaceAll(/[!$%^&*()_+|~=`{}\[\]:";'<>?,\/]/g, '').replaceAll(' ', '-'));
    }
}


export default Handler;