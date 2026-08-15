import re
import os

filepath = r'c:\Users\tanis\OneDrive\Desktop\Tanish\Xplorism\xplorism-web\frontend\src\pages\DashboardStub.jsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Import the hook
import_hook = "import { useLanguage } from '../context/LanguageContext';\nimport { useCurrency } from '../contexts/CurrencyContext';"
content = content.replace("import { useLanguage } from '../context/LanguageContext';", import_hook)

# Inject useCurrency into DashboardStub
dashboard_start = "export default function DashboardStub() {\n  const { t } = useLanguage();\n  const { formatCurrency } = useCurrency();"
content = content.replace("export default function DashboardStub() {\n  const { t } = useLanguage();", dashboard_start)

# Replace in ActivityCard
activity_card_start = "const ActivityCard = ({ item, tripCurrency, isFavorited, onToggleFavorite, onMoveUp, onMoveDown, onEdit }) => {"
activity_card_replacement = "const ActivityCard = ({ item, tripCurrency, isFavorited, onToggleFavorite, onMoveUp, onMoveDown, onEdit }) => {\n  const { formatCurrency } = useCurrency();"
content = content.replace(activity_card_start, activity_card_replacement)

# Regex to replace simple string templates like `${tripCurrency.symbol}${Number(act.estimatedCost).toLocaleString(tripCurrency.locale)}`
# with `${formatCurrency(act.estimatedCost, tripCurrency.code).formatted}`

pattern1 = r"\$\{tripCurrency\.symbol\}\$\{Number\((.*?)\)\.toLocaleString\(tripCurrency\.locale\)\}"
content = re.sub(pattern1, r"${formatCurrency(\1, tripCurrency.code || tripCurrency).formatted}", content)

# Regex to replace JSX interpolations like `{tripCurrency.symbol}{Number(trip.budget).toLocaleString(tripCurrency.locale)}`
# with `{formatCurrency(trip.budget, tripCurrency.code || tripCurrency).formatted}`

pattern2 = r"\{tripCurrency\.symbol\}\{Number\((.*?)\)\.toLocaleString\(tripCurrency\.locale\)\}"
content = re.sub(pattern2, r"{formatCurrency(\1, tripCurrency.code || tripCurrency).formatted}", content)

# Replace ActivityCard free logic
pattern_activity = r"Number\(item\.estimatedCost\) > 0 \? `\$\{tripCurrency\.symbol\}\$\{Number\(item\.estimatedCost\)\.toLocaleString\(tripCurrency\.locale\)\}` : 'Free'"
content = re.sub(pattern_activity, r"Number(item.estimatedCost) > 0 ? formatCurrency(item.estimatedCost, tripCurrency.code || tripCurrency).formatted : 'Free'", content)

# There is a spot where `tripCurrency.code` isn't available, but `tripCurrency` is a string code in `DashboardStub`. Actually, `tripCurrency` is an object from `CURRENCIES` which has `.code`.
# But wait, in ActivityCard: `{Number(item.estimatedCost) > 0 ? \`...` : 'Free'} was wrapped in {} but inside JSX. The string template substitution above will catch it, but it was already changed by the regex above! Let's just run pattern1 and pattern2, they are robust.

# Also, there's `{tripCurrency.symbol}{sug.estimatedCost}`
pattern3 = r"\{tripCurrency\.symbol\}\{(.*?)\.estimatedCost\}"
content = re.sub(pattern3, r"{formatCurrency(\1.estimatedCost, tripCurrency.code || tripCurrency).formatted}", content)

# Update `getSelectedTripCurrency` if necessary, or just leave it.

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
